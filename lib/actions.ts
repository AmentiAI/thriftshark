"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createOrder } from "@/lib/orders";
import { endSession, isAdmin, passwordMatches, requireAdmin, startSession } from "@/lib/auth";
import {
  currentSeller,
  endSellerSession,
  hashPassword,
  requireSeller,
  startSellerSession,
  verifyPassword,
} from "@/lib/seller-auth";
import { ensureCurrentGiveaway, getGiveawayById } from "@/lib/giveaways";
import { ensureBuyerKey, currentBuyerKey } from "@/lib/buyer-auth";
import {
  currentBuyer,
  endBuyerSession,
  isBuyerVerified,
  startBuyerSession,
} from "@/lib/buyer-account";
import { deleteBlobUrls, storeUpload } from "@/lib/images";
import { getOrderByNumber, getOrderGroup, getSellerByHandle } from "@/lib/queries";
import {
  createCheckoutSessionForOrder,
  createSellerAccountLink,
  syncSellerFromStripeAccount,
} from "@/lib/stripe-connect";
import {
  createBuyerVerifiedCheckout,
  createSellerBillingPortal,
  createVerifiedPassCheckout,
} from "@/lib/stripe-billing";
import { stripeConfigured } from "@/lib/stripe";
import { createSellerIdentitySession, sellerIdVerified } from "@/lib/stripe-identity";
import {
  FREE_MAX_LIVE_LISTINGS,
  VERIFIED_LISTING_PHOTOS,
  VERIFIED_SPOTLIGHT_CAP,
  isSellerVerified,
  listingPhotoLimit,
  liveListingLimit,
} from "@/lib/seller-plan";
import { STATUSES, SELLER_SETTABLE_STATUSES, CONDITIONS, type Seller } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | null;

const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";
const optional = (v: FormDataEntryValue | null) => text(v) || null;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/* ---------- storefront ---------- */

const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  customer_name: z.string().min(2, "Tell us your name."),
  phone: z.string().nullable(),
  fulfilment: z.enum(["ship", "pickup"]),
  address_line1: z.string().nullable(),
  address_line2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
  notes: z.string().nullable(),
});

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const ids = text(formData.get("item_ids"))
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  const parsed = checkoutSchema.safeParse({
    email: text(formData.get("email")),
    customer_name: text(formData.get("customer_name")),
    phone: optional(formData.get("phone")),
    fulfilment: text(formData.get("fulfilment")) === "pickup" ? "pickup" : "ship",
    address_line1: optional(formData.get("address_line1")),
    address_line2: optional(formData.get("address_line2")),
    city: optional(formData.get("city")),
    region: optional(formData.get("region")),
    postal_code: optional(formData.get("postal_code")),
    country: optional(formData.get("country")),
    notes: optional(formData.get("notes")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const details = parsed.data;
  if (details.fulfilment === "ship" && (!details.address_line1 || !details.city || !details.postal_code)) {
    return { error: "We need a street address, city and postcode to ship." };
  }

  const shopper = await currentBuyer();
  const seller = await currentSeller();
  if (!shopper && !seller) {
    return { error: "Create an account and sign in before you check out." };
  }
  const result = await createOrder(ids, {
    ...details,
    email: shopper?.email ?? seller!.email,
    buyerVerified: Boolean(
      (shopper && isBuyerVerified(shopper)) || (seller && isSellerVerified(seller)),
    ),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/shop");

  // Stripe Connect: one Checkout Session per shop order when that seller is ready.
  // Single-shop carts go straight to Stripe; multi-shop carts land on the receipt
  // so the buyer can pay each shop separately.
  if (stripeConfigured()) {
    const orders = await getOrderGroup(result.groupToken);
    const ready = orders.filter(
      (o) => o.seller_stripe_charges_enabled && o.seller_stripe_account_id,
    );
    if (ready.length === 1 && orders.length === 1) {
      const session = await createCheckoutSessionForOrder(ready[0]);
      if (session.ok) redirect(session.url);
    } else {
      for (const order of ready) {
        await createCheckoutSessionForOrder(order);
      }
    }
  }

  redirect(`/order/${result.groupToken}`);
}

/** Buyer leaves one review on a paid order, from the receipt. */
export async function leaveSellerReview(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const orderId = Number(text(formData.get("order_id")));
  const token = text(formData.get("token"));
  const rating = Number(text(formData.get("rating")));
  const body = optional(formData.get("body"));

  if (!token || !Number.isInteger(orderId) || orderId <= 0) {
    return { error: "That order is missing." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pick a rating from 1 to 5." };
  }
  if (body && body.length > 500) {
    return { error: "Keep the review under 500 characters." };
  }

  const rows = (await sql`
    select o.id, o.seller_id, o.payment_status, o.customer_name, o.email,
           s.email as seller_email, s.handle
    from orders o
    join sellers s on s.id = o.seller_id
    where o.id = ${orderId}
      and (o.group_token = ${token} or o.order_number = ${token})
  `) as {
    id: number;
    seller_id: number;
    payment_status: string;
    customer_name: string;
    email: string;
    seller_email: string;
    handle: string;
  }[];

  const order = rows[0];
  if (!order) return { error: "That order is not on this receipt." };
  if (order.payment_status !== "paid") {
    return { error: "You can review a shop after the order is paid." };
  }
  if (order.email.toLowerCase() === order.seller_email.toLowerCase()) {
    return { error: "You can’t review your own shop." };
  }

  const reviewer = order.customer_name.split(/\s+/)[0] || "Buyer";
  const inserted = (await sql`
    insert into seller_reviews (seller_id, order_id, rating, body, reviewer_name)
    values (${order.seller_id}, ${order.id}, ${rating}, ${body}, ${reviewer})
    on conflict (order_id) do nothing
    returning id
  `) as { id: number }[];

  if (!inserted[0]) return { error: "This order already has a review." };

  revalidatePath(`/shop/${order.handle}`);
  revalidatePath(`/order/${token}`);
  revalidatePath("/sellers");
  revalidatePath("/dashboard");
  return { ok: "Review posted." };
}

/** Buyer resumes / starts Stripe Checkout for one order on the receipt page. */
export async function payOrderWithStripe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!stripeConfigured()) {
    return { error: "Card checkout is not configured yet." };
  }

  const token = text(formData.get("token"));
  const orderId = Number(text(formData.get("order_id")));
  if (!token || !Number.isInteger(orderId) || orderId <= 0) {
    return { error: "That order is missing." };
  }

  let orders = await getOrderGroup(token);
  if (orders.length === 0) {
    const single = await getOrderByNumber(token);
    if (single) orders = [single];
  }
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: "That order is not on this receipt." };

  const session = await createCheckoutSessionForOrder(order);
  if (!session.ok) return { error: session.error };
  redirect(session.url);
}

/** Seller: create Express account (if needed) and open Stripe-hosted onboarding. */
export async function startStripeOnboarding(): Promise<void> {
  const seller = await requireSeller();
  const link = await createSellerAccountLink(seller);
  if (!link.ok) {
    redirect(`/dashboard/shop?stripe=error&msg=${encodeURIComponent(link.error)}`);
  }
  redirect(link.url);
}

/** Seller returned from Stripe — refresh charges/payouts flags immediately. */
export async function refreshStripeStatus(): Promise<void> {
  const seller = await requireSeller();
  if (!seller.stripe_account_id || !stripeConfigured()) {
    redirect("/dashboard/shop");
  }
  try {
    await syncSellerFromStripeAccount(seller.stripe_account_id);
  } catch {
    // Still bounce back; the panel shows current DB flags.
  }
  revalidatePath("/dashboard/shop");
  revalidatePath("/dashboard");
  redirect("/dashboard/shop");
}

/** Seller: pay $20 for 30 days of Verified (stacks if time is left). */
export async function startBuyerVerified(): Promise<void> {
  const buyer = await currentBuyer();
  if (!buyer) redirect("/login?next=/account");
  const session = await createBuyerVerifiedCheckout(buyer);
  if (!session.ok) {
    redirect(`/account?plan=error&msg=${encodeURIComponent(session.error)}`);
  }
  redirect(session.url);
}

export async function startSellerSubscription(): Promise<void> {
  const seller = await requireSeller();
  const session = await createVerifiedPassCheckout(seller);
  if (!session.ok) {
    redirect(`/dashboard/verified?plan=error&msg=${encodeURIComponent(session.error)}`);
  }
  redirect(session.url);
}

/** Seller: open Stripe Customer Portal to manage / cancel the plan. */
export async function openSellerBillingPortal(): Promise<void> {
  const seller = await requireSeller();
  const session = await createSellerBillingPortal(seller);
  if (!session.ok) {
    redirect(`/dashboard/verified?plan=error&msg=${encodeURIComponent(session.error)}`);
  }
  redirect(session.url);
}

const contactSchema = z.object({
  name: z.string().min(2, "Tell us your name."),
  email: z.string().email("Enter a valid email address."),
  subject: z.string().nullable(),
  body: z.string().min(10, "Add a little more detail so we can help."),
});

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: text(formData.get("name")),
    email: text(formData.get("email")),
    subject: optional(formData.get("subject")),
    body: text(formData.get("body")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const itemId = Number(text(formData.get("item_id")));
  await sql`
    insert into messages (name, email, subject, body, item_id)
    values (${parsed.data.name}, ${parsed.data.email}, ${parsed.data.subject},
            ${parsed.data.body}, ${Number.isInteger(itemId) && itemId > 0 ? itemId : null})
  `;
  return { ok: "Message sent. We usually reply within a day." };
}

const dmStartSchema = z.object({
  name: z.string().min(2, "Tell the shop your name.").max(80, "That name is too long."),
  email: z.string().email("Enter a valid email address.").max(200),
  body: z.string().min(1, "Write a message.").max(2000, "Keep it under 2,000 characters."),
});

const dmReplySchema = z
  .string()
  .min(1, "Write a message.")
  .max(2000, "Keep it under 2,000 characters.");

/** Start or continue a direct message with one shop. */
export async function openDm(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await getSellerByHandle(text(formData.get("handle")));
  if (!seller) return { error: "That shop is not taking messages." };

  const parsed = dmStartSchema.safeParse({
    name: text(formData.get("name")),
    email: text(formData.get("email")).toLowerCase(),
    body: text(formData.get("body")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const rawItem = Number(text(formData.get("item_id")));
  let itemId: number | null = null;
  if (Number.isInteger(rawItem) && rawItem > 0) {
    const owned = (await sql`
      select id from items where id = ${rawItem} and seller_id = ${seller.id}
    `) as { id: number }[];
    if (owned[0]) itemId = owned[0].id;
  }

  const key = await ensureBuyerKey();
  const rows = (await sql`
    with thread as (
      insert into dm_threads (seller_id, buyer_name, buyer_email, buyer_key, item_id)
      values (${seller.id}, ${parsed.data.name}, ${parsed.data.email}, ${key}, ${itemId})
      on conflict (seller_id, buyer_key) do update
        set buyer_name = excluded.buyer_name,
            buyer_email = excluded.buyer_email,
            item_id = coalesce(excluded.item_id, dm_threads.item_id),
            updated_at = now()
      returning id
    )
    insert into dm_messages (thread_id, sender, body)
    select id, 'buyer', ${parsed.data.body} from thread
    returning thread_id
  `) as { thread_id: number }[];

  revalidatePath("/inbox");
  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/messages");
  redirect(`/inbox/${rows[0].thread_id}`);
}

export async function replyAsBuyer(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = await currentBuyerKey();
  if (!key) return { error: "Open this conversation from the browser you started it in." };

  const id = Number(text(formData.get("thread_id")));
  const body = dmReplySchema.safeParse(text(formData.get("body")));
  if (!Number.isInteger(id) || id <= 0) return { error: "That conversation is missing." };
  if (!body.success) return { error: body.error.issues[0].message };

  const owned = (await sql`
    update dm_threads set updated_at = now()
    where id = ${id} and buyer_key = ${key}
    returning id
  `) as { id: number }[];
  if (!owned[0]) return { error: "That conversation is not yours." };

  await sql`
    insert into dm_messages (thread_id, sender, body)
    values (${id}, 'buyer', ${body.data})
  `;

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${id}`);
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${id}`);
  revalidatePath("/admin/messages");
  redirect(`/inbox/${id}`);
}

export async function replyAsSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();
  const id = Number(text(formData.get("thread_id")));
  const body = dmReplySchema.safeParse(text(formData.get("body")));
  if (!Number.isInteger(id) || id <= 0) return { error: "That conversation is missing." };
  if (!body.success) return { error: body.error.issues[0].message };

  const owned = (await sql`
    update dm_threads set updated_at = now()
    where id = ${id} and seller_id = ${seller.id}
    returning id
  `) as { id: number }[];
  if (!owned[0]) return { error: "That conversation is not yours." };

  await sql`
    insert into dm_messages (thread_id, sender, body)
    values (${id}, 'seller', ${body.data})
  `;

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${id}`);
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${id}`);
  revalidatePath("/admin/messages");
  redirect(`/dashboard/messages/${id}`);
}

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email")).toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "That email does not look right." };
  }
  await sql`insert into subscribers (email) values (${email}) on conflict (email) do nothing`;
  return { ok: "You're on the list. New drops hit your inbox first." };
}

/* ---------- admin auth ---------- */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = text(formData.get("password"));
  if (!password || !passwordMatches(password)) {
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- admin: items ---------- */

const itemSchema = z.object({
  title: z.string().min(2, "An item needs a title."),
  description: z.string(),
  price_cents: z.number().int().min(0, "Price cannot be negative."),
  compare_at_cents: z.number().int().min(0).nullable(),
  category_id: z.number().int().nullable(),
  brand: z.string().nullable(),
  item_size: z.string().nullable(),
  condition: z.enum(CONDITIONS.map((c) => c.value) as [string, ...string[]]),
  color: z.string().nullable(),
  status: z.enum(STATUSES as [string, ...string[]]),
  featured: z.boolean(),
});

/** "38.50" or "38,50" or "$38.50" -> 3850 */
function toCents(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function readItemForm(formData: FormData) {
  const price = toCents(text(formData.get("price")));
  const compareRaw = text(formData.get("compare_at"));
  const categoryRaw = text(formData.get("category_id"));

  return itemSchema.safeParse({
    title: text(formData.get("title")),
    description: text(formData.get("description")),
    price_cents: price ?? -1,
    compare_at_cents: compareRaw ? toCents(compareRaw) : null,
    category_id: categoryRaw ? Number(categoryRaw) : null,
    brand: optional(formData.get("brand")),
    item_size: optional(formData.get("item_size")),
    condition: text(formData.get("condition")) || "good",
    color: optional(formData.get("color")),
    status: text(formData.get("status")) || "available",
    featured: formData.get("featured") === "on",
  });
}

async function countLiveListings(sellerId: number, exceptItemId?: number) {
  const rows = (await sql.query(
    `select count(*)::int as n from items
     where seller_id = $1
       and status in ('available', 'auction')
       and ($2::int is null or id <> $2::int)`,
    [sellerId, exceptItemId ?? null],
  )) as { n: number }[];
  return rows[0]?.n ?? 0;
}

async function countSpotlights(sellerId: number, exceptItemId?: number) {
  const rows = (await sql.query(
    `select count(*)::int as n from items
     where seller_id = $1
       and featured
       and status in ('available', 'draft', 'reserved')
       and ($2::int is null or id <> $2::int)`,
    [sellerId, exceptItemId ?? null],
  )) as { n: number }[];
  return rows[0]?.n ?? 0;
}

async function resolveVerifiedListingFlags(
  seller: { id: number; subscription_status?: string | null; official?: boolean | null },
  d: { compare_at_cents: number | null; featured: boolean; status: string },
  opts: {
    wantsAuction: boolean;
    exceptItemId?: number;
    previousStatus?: string;
    /** Already pinned — keep it without counting against the cap again. */
    previousFeatured?: boolean;
  },
): Promise<{ ok: true; compareAt: number | null; featured: boolean } | { ok: false; error: string }> {
  const verified = isSellerVerified(seller);
  const compareAt = verified ? d.compare_at_cents : null;

  let featured = false;
  if (d.featured) {
    if (!verified) {
      return {
        ok: false,
        error: "Spotlight listings are a Verified perk — subscribe on Your storefront.",
      };
    }
    const keepingPin = Boolean(opts.previousFeatured);
    if (!keepingPin) {
      const used = await countSpotlights(seller.id, opts.exceptItemId);
      if (used >= VERIFIED_SPOTLIGHT_CAP) {
        return {
          ok: false,
          error: `Verified shops can spotlight up to ${VERIFIED_SPOTLIGHT_CAP} live listings.`,
        };
      }
    }
    featured = true;
  }

  const goingLive =
    opts.wantsAuction ||
    d.status === "available" ||
    d.status === "auction";
  const wasLive =
    opts.previousStatus === "available" || opts.previousStatus === "auction";
  const limit = liveListingLimit(verified);
  if (goingLive && limit !== null && !wasLive) {
    const live = await countLiveListings(seller.id, opts.exceptItemId);
    if (live >= limit) {
      return {
        ok: false,
        error: `Free shops can have ${FREE_MAX_LIVE_LISTINGS} live listings. Get Verified for unlimited.`,
      };
    }
  }

  return { ok: true, compareAt, featured };
}

async function uniqueSlug(title: string, ignoreId?: number) {
  const base = slugify(title) || "item";
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const clash = (await sql.query(
      `select 1 from items where slug = $1 and ($2::int is null or id <> $2::int) limit 1`,
      [candidate, ignoreId ?? null],
    )) as unknown[];
    if (clash.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Platform-wide moderation: pull a listing down without touching the shop. */
export async function setItemStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  if (Number.isInteger(id) && id > 0 && (STATUSES as string[]).includes(status)) {
    await sql`update items set status = ${status}, updated_at = now() where id = ${id}`;
  }
  revalidatePath("/admin/items");
  revalidatePath("/shop");
}

/* ---------- admin: orders & messages ---------- */

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  const payment = text(formData.get("payment_status"));

  if (!Number.isInteger(id) || id <= 0) return;
  if (["new", "packed", "shipped", "picked-up", "cancelled"].includes(status)) {
    await sql`update orders set status = ${status} where id = ${id}`;
  }
  if (["pending", "paid", "refunded"].includes(payment)) {
    await sql`update orders set payment_status = ${payment} where id = ${id}`;
  }
  revalidatePath("/admin/orders");
}

/**
 * Shared by the platform inbox and the seller inbox: an admin can flag any
 * message, a seller only the ones attached to their own listings.
 */
export async function toggleMessageHandled(formData: FormData) {
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return;

  if (await isAdmin()) {
    await sql`update messages set handled = not handled where id = ${id}`;
  } else {
    const seller = await requireSeller();
    await sql`
      update messages set handled = not handled
      where id = ${id}
        and item_id in (select id from items where seller_id = ${seller.id})
    `;
  }

  revalidatePath("/admin/messages");
  revalidatePath("/dashboard/messages");
}

/* ---------- sellers: accounts ---------- */

const RESERVED_HANDLES = new Set([
  "admin", "api", "shop", "item", "cart", "checkout", "order", "orders",
  "about", "sell", "contact", "sellers", "dashboard", "login", "signup",
  "signin", "logout", "images", "static", "_next", "sitemap", "robots",
]);

const handleSchema = z
  .string()
  .min(3, "Your shop link needs at least 3 characters.")
  .max(24, "Keep your shop link under 24 characters.")
  .regex(/^[a-z0-9-]+$/, "Shop links can use lowercase letters, numbers and dashes only.");

const signupSchema = z.object({
  shop_name: z.string().min(2, "Give your shop a name."),
  handle: handleSchema,
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use a password of at least 8 characters."),
  tagline: z.string().nullable(),
  location: z.string().nullable(),
});

export async function signUpSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  const handleInput = text(formData.get("handle")).toLowerCase().replace(/^@/, "");

  const parsed = signupSchema.safeParse({
    shop_name: text(formData.get("shop_name")),
    handle: handleInput,
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
    tagline: optional(formData.get("tagline")),
    location: optional(formData.get("location")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (RESERVED_HANDLES.has(d.handle)) {
    return { error: `“${d.handle}” is reserved. Try another shop link.` };
  }

  const clashes = (await sql`
    select handle, email from sellers where handle = ${d.handle} or email = ${d.email}
  `) as { handle: string; email: string }[];

  if (clashes.some((c) => c.handle === d.handle)) {
    return { error: `Someone already has thriftshark.com/shop/${d.handle}. Pick another.` };
  }
  if (clashes.some((c) => c.email === d.email)) {
    return { error: "That email already has a shop. Sign in instead." };
  }
  const buyerTaken = (await sql`
    select 1 from buyers where email = ${d.email} limit 1
  `) as unknown[];
  if (buyerTaken[0]) return { error: "That email already has an account. Sign in instead." };

  const rows = (await sql`
    insert into sellers (handle, shop_name, email, password_hash, tagline, location, identity_status)
    values (${d.handle}, ${d.shop_name}, ${d.email}, ${hashPassword(d.password)},
            ${d.tagline}, ${d.location}, 'required')
    returning *
  `) as Seller[];

  const created = rows[0];
  await startSellerSession(created.id);
  revalidatePath("/sellers");

  const identity = await createSellerIdentitySession(created);
  if (identity.ok) redirect(identity.url);
  redirect(`/dashboard?identity=error&msg=${encodeURIComponent(identity.error)}`);
}

export async function startSellerIdentity(): Promise<void> {
  const seller = await requireSeller();
  const identity = await createSellerIdentitySession(seller);
  if (!identity.ok) {
    redirect(`/dashboard?identity=error&msg=${encodeURIComponent(identity.error)}`);
  }
  redirect(identity.url);
}

const buyerSignupSchema = z.object({
  name: z.string().min(2, "Tell us your name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use a password of at least 8 characters."),
});

export async function signUpBuyer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = buyerSignupSchema.safeParse({
    name: text(formData.get("name")),
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const taken = (await sql`
    select 1 from buyers where email = ${d.email}
    union all
    select 1 from sellers where email = ${d.email}
    limit 1
  `) as unknown[];
  if (taken[0]) return { error: "That email already has an account. Sign in instead." };

  const rows = (await sql`
    insert into buyers (name, email, password_hash)
    values (${d.name}, ${d.email}, ${hashPassword(d.password)})
    returning id
  `) as { id: number }[];

  await endSellerSession();
  await startBuyerSession(rows[0].id);
  redirect("/account");
}

export async function signUp(prev: FormState, formData: FormData): Promise<FormState> {
  if (text(formData.get("role")) === "store") return signUpSeller(prev, formData);
  return signUpBuyer(prev, formData);
}

export async function signInSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const next = text(formData.get("next"));
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "";

  const buyers = (await sql`
    select id, password_hash, status from buyers where email = ${email}
  `) as { id: number; password_hash: string; status: string }[];
  const buyer = buyers[0];
  if (buyer && verifyPassword(password, buyer.password_hash)) {
    if (buyer.status !== "active") {
      return { error: "This account has been suspended. Email us if you think that is a mistake." };
    }
    await endSellerSession();
    await startBuyerSession(buyer.id);
    redirect(dest || "/account");
  }

  const rows = (await sql`
    select id, password_hash, status from sellers where email = ${email}
  `) as { id: number; password_hash: string; status: string }[];

  const seller = rows[0];
  // Same message either way, so this cannot be used to enumerate accounts.
  if (!seller || !verifyPassword(password, seller.password_hash)) {
    return { error: "That email and password do not match." };
  }
  if (seller.status !== "active") {
    return { error: "This shop has been suspended. Email us if you think that is a mistake." };
  }

  await endBuyerSession();
  await startSellerSession(seller.id);
  redirect(dest || "/dashboard");
}

export async function signOutSeller() {
  await endSellerSession();
  await endBuyerSession();
  redirect("/");
}

/* ---------- sellers: storefront settings ---------- */

const shopSchema = z.object({
  shop_name: z.string().min(2, "Give your shop a name."),
  handle: handleSchema,
  tagline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
});

export async function updateShop(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();

  const parsed = shopSchema.safeParse({
    shop_name: text(formData.get("shop_name")),
    handle: text(formData.get("handle")).toLowerCase().replace(/^@/, ""),
    tagline: optional(formData.get("tagline")),
    bio: optional(formData.get("bio")),
    location: optional(formData.get("location")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.handle !== seller.handle) {
    if (RESERVED_HANDLES.has(d.handle)) {
      return { error: `“${d.handle}” is reserved. Try another shop link.` };
    }
    const taken = (await sql`
      select 1 from sellers where handle = ${d.handle} and id <> ${seller.id}
    `) as unknown[];
    if (taken.length > 0) {
      return { error: `thriftshark.com/shop/${d.handle} is taken.` };
    }
  }

  // Logo and banner are optional on every save; keep what is there otherwise.
  let logoId = seller.logo_image_id;
  let bannerId = seller.banner_image_id;

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const stored = await storeUpload(logo, seller.id, "logo");
    if (!stored.ok) return { error: stored.error };
    logoId = stored.id;
  }

  const banner = formData.get("banner");
  if (banner instanceof File && banner.size > 0) {
    const stored = await storeUpload(banner, seller.id, "banner");
    if (!stored.ok) return { error: stored.error };
    bannerId = stored.id;
  }

  const place = (raw: FormDataEntryValue | null, fallback: number) => {
    const n = Number(text(raw));
    if (!Number.isFinite(n)) return fallback;
    return Math.round(Math.min(100, Math.max(0, n)));
  };

  await sql`
    update sellers set
      shop_name = ${d.shop_name}, handle = ${d.handle}, tagline = ${d.tagline},
      bio = ${d.bio}, location = ${d.location},
      logo_image_id = ${logoId}, banner_image_id = ${bannerId},
      banner_x = ${place(formData.get("banner_x"), seller.banner_x ?? 50)},
      banner_y = ${place(formData.get("banner_y"), seller.banner_y ?? 50)},
      logo_x = ${place(formData.get("logo_x"), seller.logo_x ?? 50)},
      logo_y = ${place(formData.get("logo_y"), seller.logo_y ?? 50)},
      updated_at = now()
    where id = ${seller.id}
  `;

  revalidatePath("/sellers");
  revalidatePath(`/shop/${d.handle}`);
  revalidatePath("/");
  return { ok: "Storefront saved." };
}

/* ---------- sellers: their own listings ---------- */

/** Stay under typical serverless request body limits (~4.5MB on Vercel). */
const MAX_PHOTO_BATCH_BYTES = 3.5 * 1024 * 1024;

async function readPhotos(formData: FormData, sellerId: number, maxPhotos: number) {
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, maxPhotos);

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_PHOTO_BATCH_BYTES) {
    return {
      ok: false as const,
      error: `Those photos add up to ${(total / 1024 / 1024).toFixed(1)}MB. Add fewer at once (or wait for the page to finish shrinking them), then save again.`,
    };
  }

  const ids: number[] = [];
  try {
    for (const file of files) {
      const stored = await storeUpload(file, sellerId, "item");
      if (!stored.ok) {
        await deleteOrphanImages(sellerId, ids);
        return { ok: false as const, error: stored.error };
      }
      ids.push(stored.id);
    }
  } catch (err) {
    console.error("readPhotos failed", err);
    await deleteOrphanImages(sellerId, ids);
    return {
      ok: false as const,
      error: "Could not save those photos. Try fewer images, or a stronger connection.",
    };
  }
  return { ok: true as const, ids };
}

/**
 * The order the seller left the photo set in: `e:<item_images id>` for a photo
 * already on the listing, `n:<index>` for the nth uploaded file. Null when the
 * form did not send one (no JavaScript), which means "uploads in pick order".
 */
function readPhotoOrder(formData: FormData) {
  const raw = formData.get("photos_order");
  if (typeof raw !== "string") return null;
  const tokens: { kind: "e" | "n"; n: number }[] = [];
  for (const part of raw.split(",")) {
    const m = /^([en]):(\d{1,9})$/.exec(part.trim());
    if (m) tokens.push({ kind: m[1] as "e" | "n", n: Number(m[2]) });
  }
  return tokens.slice(0, VERIFIED_LISTING_PHOTOS);
}

/**
 * Makes the listing's photos exactly what the seller left on screen: drops the
 * ones they removed, adds the new uploads and renumbers the lot. With no order
 * (no JavaScript) new uploads replace the set and none keeps it. Returns how
 * many photos the listing ends up with.
 */
async function savePhotoSet(
  itemId: number,
  sellerId: number,
  alt: string,
  uploaded: number[],
  order: { kind: "e" | "n"; n: number }[] | null,
) {
  const current = (await sql`
    select im.id, im.image_id from item_images im
    join items i on i.id = im.item_id
    where im.item_id = ${itemId} and i.seller_id = ${sellerId}
    order by im.position, im.id
  `) as { id: number; image_id: number | null }[];

  const plan: ({ row: number } | { image: number })[] = [];
  if (order) {
    const owned = new Set(current.map((r) => r.id));
    const seen = new Set<string>();
    for (const t of order) {
      const key = `${t.kind}:${t.n}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (t.kind === "e" && owned.has(t.n)) plan.push({ row: t.n });
      if (t.kind === "n" && uploaded[t.n] !== undefined) plan.push({ image: uploaded[t.n] });
    }
  } else if (uploaded.length > 0) {
    for (const image of uploaded) plan.push({ image });
  } else {
    for (const r of current) plan.push({ row: r.id });
  }
  const placed = new Set(plan.flatMap((p) => ("image" in p ? [p.image] : [])));
  await deleteOrphanImages(sellerId, uploaded.filter((image) => !placed.has(image)));
  if (plan.length === 0) return 0;

  const keep = plan.flatMap((p) => ("row" in p ? [p.row] : []));
  const dropped = current.filter((r) => !keep.includes(r.id));

  let position = 0;
  for (const p of plan) {
    if ("row" in p) {
      await sql`update item_images set position = ${position++}, alt = ${alt}
                where id = ${p.row} and item_id = ${itemId}`;
    } else {
      const urlRows = (await sql`
        select coalesce(blob_url, '/api/images/' || id::text) as url
        from images where id = ${p.image}
      `) as { url: string }[];
      const url = urlRows[0]?.url ?? `/api/images/${p.image}`;
      await sql`insert into item_images (item_id, image_id, url, alt, position)
                values (${itemId}, ${p.image}, ${url}, ${alt}, ${position++})`;
    }
  }

  if (dropped.length > 0) {
    await sql`delete from item_images
              where item_id = ${itemId} and id = any(${dropped.map((r) => r.id)}::int[])`;
    await deleteOrphanImages(sellerId, dropped.flatMap((r) => (r.image_id ? [r.image_id] : [])));
  }
  return plan.length;
}

/** Frees Blob objects + image rows nothing points at any more. */
async function deleteOrphanImages(sellerId: number, imageIds: number[]) {
  if (imageIds.length === 0) return;
  const orphans = (await sql.query(
    `select im.id, im.blob_url
     from images im
     where im.id = any($1::int[]) and im.seller_id = $2
       and im.purpose = 'item'
       and not exists (select 1 from item_images ii where ii.image_id = im.id)`,
    [imageIds, sellerId],
  )) as { id: number; blob_url: string | null }[];

  if (orphans.length === 0) return;
  await deleteBlobUrls(orphans.map((o) => o.blob_url));
  await sql.query(
    `delete from images where id = any($1::int[]) and seller_id = $2`,
    [orphans.map((o) => o.id), sellerId],
  );
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const seller = await requireSeller();
    const parsed = readItemForm(formData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const d = parsed.data;
    if (d.status === "auction") {
      return { error: "Start an auction from the Auctions tab, not from the status field." };
    }

    const wantsAuction = text(formData.get("destination")) === "auction";
    if (!sellerIdVerified(seller) && (d.status !== "draft" || wantsAuction)) {
      return { error: "Verify your ID with Stripe before this shop can sell." };
    }
    if (wantsAuction && !isSellerVerified(seller)) {
      return {
        error: "Auctions are a Verified perk — pay $20 for 30 days on the Verified tab.",
      };
    }
    const lot = wantsAuction ? readAuctionFields(formData) : null;
    if (lot && "error" in lot) return { error: lot.error };

    const flags = await resolveVerifiedListingFlags(seller, d, { wantsAuction });
    if (!flags.ok) return { error: flags.error };

    const photos = await readPhotos(
      formData,
      seller.id,
      listingPhotoLimit(isSellerVerified(seller)),
    );
    if (!photos.ok) return { error: photos.error };
    if (photos.ids.length === 0) {
      return { error: "Add at least one photo — nothing sells without one." };
    }

    const slug = await uniqueSlug(d.title);
    const rows = (await sql`
      insert into items (slug, title, description, price_cents, compare_at_cents, category_id,
                         brand, item_size, condition, color, status, featured, seller_id)
      values (${slug}, ${d.title}, ${d.description}, ${d.price_cents}, ${flags.compareAt},
              ${d.category_id}, ${d.brand}, ${d.item_size}, ${d.condition}, ${d.color},
              ${lot ? "auction" : d.status}, ${flags.featured}, ${seller.id})
      returning id
    `) as { id: number }[];

    const id = rows[0].id;
    await savePhotoSet(id, seller.id, d.title, photos.ids, readPhotoOrder(formData));

    let auctionId: number | null = null;
    if (lot) {
      try {
        auctionId = await insertLiveAuction(seller.id, id, lot);
      } catch {
        await sql`update items set status = 'available', updated_at = now()
                  where id = ${id} and seller_id = ${seller.id}`;
        return { error: "Could not open the lot. The piece is on the rack instead — try Auctions." };
      }
    }

    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(`/shop/${seller.handle}`);
    if (auctionId) {
      revalidatePath("/auctions");
      redirect(`/auctions/${auctionId}`);
    }
    redirect(`/dashboard/items/${id}?saved=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("createListing failed", err);
    return {
      error:
        "Could not publish that listing. Try fewer photos, wait for them to finish shrinking, then save again.",
    };
  }
}

export async function updateListing(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const seller = await requireSeller();
    const id = Number(text(formData.get("id")));
    if (!Number.isInteger(id) || id <= 0) return { error: "Unknown listing." };

    // Ownership is checked in the statement itself, not just in the page.
    const owned = (await sql`
      select status, featured from items where id = ${id} and seller_id = ${seller.id}
    `) as { status: string; featured: boolean }[];
    if (owned.length === 0) return { error: "That listing is not yours." };

    const parsed = readItemForm(formData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const d = parsed.data;

    // Mid-auction, the lot owns the status: keep whatever it already is.
    const onBlock = owned[0].status === "auction";
    const status = onBlock ? "auction" : d.status === "auction" ? "available" : d.status;
    if (!sellerIdVerified(seller) && status === "available" && owned[0].status !== "available") {
      return { error: "Verify your ID with Stripe before this shop can sell." };
    }

    const flags = await resolveVerifiedListingFlags(
      seller,
      { ...d, status },
      {
        wantsAuction: false,
        exceptItemId: id,
        previousStatus: owned[0].status,
        previousFeatured: Boolean(owned[0].featured),
      },
    );
    if (!flags.ok) return { error: flags.error };

    const maxPhotos = listingPhotoLimit(isSellerVerified(seller));
    const order = readPhotoOrder(formData);
    if (order && order.length === 0) {
      return { error: "Keep at least one photo — nothing sells without one." };
    }
    if (order && order.length > maxPhotos) {
      const excess = order.length - maxPhotos;
      return {
        error: isSellerVerified(seller)
          ? `Keep it to ${maxPhotos} photos per listing.`
          : `Remove ${excess} photo${excess === 1 ? "" : "s"} to save — free shops get ${maxPhotos} (Verified unlocks more).`,
      };
    }
    const photos = await readPhotos(formData, seller.id, maxPhotos);
    if (!photos.ok) return { error: photos.error };

    // Photos first so a failed set does not leave metadata half-saved.
    const kept = await savePhotoSet(id, seller.id, d.title, photos.ids, order);
    if (kept === 0) {
      return { error: "Keep at least one photo — nothing sells without one." };
    }

    const slug = await uniqueSlug(d.title, id);
    await sql`
      update items set
        slug = ${slug}, title = ${d.title}, description = ${d.description},
        price_cents = ${d.price_cents}, compare_at_cents = ${flags.compareAt},
        category_id = ${d.category_id}, brand = ${d.brand}, item_size = ${d.item_size},
        condition = ${d.condition}, color = ${d.color}, status = ${status},
        featured = ${flags.featured},
        updated_at = now()
      where id = ${id} and seller_id = ${seller.id}
    `;

    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(`/shop/${seller.handle}`);
    revalidatePath(`/item/${slug}`);
    revalidatePath(`/dashboard/items/${id}`);
    return { ok: "Listing saved." };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("updateListing failed", err);
    return {
      error:
        "Could not save that listing. Try fewer photos, wait for them to finish shrinking, then save again.",
    };
  }
}

export async function deleteListing(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  if (Number.isInteger(id) && id > 0) {
    const photos = (await sql`
      select im.image_id from item_images im join items i on i.id = im.item_id
      where i.id = ${id} and i.seller_id = ${seller.id} and im.image_id is not null
    `) as { image_id: number }[];
    await sql`delete from items where id = ${id} and seller_id = ${seller.id}`;
    await deleteOrphanImages(seller.id, photos.map((p) => p.image_id));
  }
  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
  redirect("/dashboard/items");
}

export async function setListingStatus(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  if (!Number.isInteger(id) || id <= 0 || !(SELLER_SETTABLE_STATUSES as string[]).includes(status)) {
    return;
  }

  const owned = (await sql`
    select status from items where id = ${id} and seller_id = ${seller.id}
  `) as { status: string }[];
  if (owned.length === 0) return;

  if (status === "available") {
    const limit = liveListingLimit(isSellerVerified(seller));
    const wasLive = owned[0].status === "available" || owned[0].status === "auction";
    if (limit !== null && !wasLive) {
      const live = await countLiveListings(seller.id, id);
      if (live >= limit) {
        redirect(
          `/dashboard/items?error=${encodeURIComponent(
            `Free shops can have ${FREE_MAX_LIVE_LISTINGS} live listings. Get Verified for unlimited.`,
          )}`,
        );
      }
    }
  }

  // An item in a live auction stays put until the lot closes.
  await sql`update items set status = ${status}, updated_at = now()
            where id = ${id} and seller_id = ${seller.id} and status <> 'auction'`;

  revalidatePath("/dashboard/items");
  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
}

export async function setSellerOrderStatus(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  const payment = text(formData.get("payment_status"));
  if (!Number.isInteger(id) || id <= 0) return;

  if (["new", "packed", "shipped", "picked-up", "cancelled"].includes(status)) {
    await sql`update orders set status = ${status}
              where id = ${id} and seller_id = ${seller.id}`;
  }
  if (["pending", "paid", "refunded"].includes(payment)) {
    await sql`update orders set payment_status = ${payment}
              where id = ${id} and seller_id = ${seller.id}`;
  }
  revalidatePath("/dashboard/orders");
}

/* ---------- platform admin: shops ---------- */

export async function setSellerStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  if (Number.isInteger(id) && id > 0 && ["active", "suspended"].includes(status)) {
    await sql`update sellers set status = ${status}, updated_at = now() where id = ${id}`;
  }
  revalidatePath("/admin/sellers");
  revalidatePath("/sellers");
  revalidatePath("/");
}

export async function toggleSellerFeatured(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (Number.isInteger(id) && id > 0) {
    await sql`update sellers set featured = not featured, updated_at = now() where id = ${id}`;
  }
  revalidatePath("/admin/sellers");
  revalidatePath("/");
}

/** Admin-granted Verified (sellers.official) — same perks as the $20/mo plan. */
export async function toggleSellerOfficial(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return;

  const rows = (await sql`
    update sellers set official = not official, updated_at = now()
    where id = ${id}
    returning handle, official
  `) as { handle: string; official: boolean }[];

  const updated = rows[0];
  revalidatePath("/admin/sellers");
  revalidatePath("/sellers");
  revalidatePath("/");
  if (updated?.handle) {
    revalidatePath(`/shop/${updated.handle}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shop");
  }
}

/* ---------- weekly giveaway ---------- */

/** Shop accounts enter the current open week once. */
export async function enterWeeklyGiveaway(
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  const seller = await currentSeller();
  if (!seller) {
    return { error: "Sign in with your shop account to enter." };
  }

  const giveaway = await ensureCurrentGiveaway();
  if (giveaway.status !== "open") {
    return { error: "This week’s giveaway is closed." };
  }

  try {
    await sql`
      insert into giveaway_entries (giveaway_id, seller_id)
      values (${giveaway.id}, ${seller.id})
      on conflict (giveaway_id, seller_id) do nothing
    `;
  } catch (err) {
    console.error("enterWeeklyGiveaway failed", err);
    return { error: "Could not enter right now. Try again in a moment." };
  }

  revalidatePath("/");
  revalidatePath("/admin/giveaway");
  return { ok: "You’re in this week’s draw." };
}

export async function updateGiveawayPrize(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const title = text(formData.get("title")) || "Weekly giveaway";
  const prize = text(formData.get("prize_text"));
  if (!Number.isInteger(id) || id <= 0 || !prize) return;

  await sql`
    update weekly_giveaways
    set title = ${title.slice(0, 80)}, prize_text = ${prize.slice(0, 240)}
    where id = ${id}
  `;
  revalidatePath("/");
  revalidatePath("/admin/giveaway");
}

export async function drawGiveawayWinner(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return;

  const giveaway = await getGiveawayById(id);
  if (!giveaway || giveaway.status === "drawn") return;
  if (giveaway.entry_count === 0) return;

  const pick = (await sql`
    select seller_id, buyer_id from giveaway_entries
    where giveaway_id = ${id}
    order by random()
    limit 1
  `) as { seller_id: number | null; buyer_id: number | null }[];

  const winner = pick[0];
  if (!winner?.seller_id && !winner?.buyer_id) return;

  await sql`
    update weekly_giveaways
    set status = 'drawn',
        winner_seller_id = ${winner.seller_id},
        winner_buyer_id = ${winner.buyer_id},
        drawn_at = now()
    where id = ${id} and status <> 'drawn'
  `;

  revalidatePath("/");
  revalidatePath("/admin/giveaway");
}

/* ---------- auction house ---------- */

const auctionSchema = z.object({
  item_id: z.number().int().positive(),
  start_cents: z.number().int().min(100, "Start the bidding at $1 or more."),
  reserve_cents: z.number().int().min(0).nullable(),
  increment_cents: z.number().int().min(50, "Bid increments start at 50c."),
  hours: z.number().int().min(1).max(336),
});

type LotTerms = {
  start_cents: number;
  reserve_cents: number | null;
  increment_cents: number;
  hours: number;
};

/** Opening bid, reserve, increment, and run length from a listing or auction form. */
function readAuctionFields(formData: FormData): LotTerms | { error: string } {
  const parsed = auctionSchema
    .omit({ item_id: true })
    .safeParse({
      start_cents: toCents(text(formData.get("start_price"))) ?? -1,
      reserve_cents: text(formData.get("reserve_price"))
        ? toCents(text(formData.get("reserve_price")))
        : null,
      increment_cents: toCents(text(formData.get("increment"))) ?? 100,
      hours: Number(text(formData.get("hours"))) || 72,
    });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.reserve_cents !== null && parsed.data.reserve_cents < parsed.data.start_cents) {
    return { error: "A reserve below the starting bid does nothing — raise it or clear it." };
  }
  return parsed.data;
}

/** Opens a live lot and takes the piece off buy-now. Returns the auction id. */
async function insertLiveAuction(sellerId: number, itemId: number, lot: LotTerms) {
  const created = (await sql`
    insert into auctions (item_id, seller_id, start_cents, reserve_cents,
                          increment_cents, ends_at)
    values (${itemId}, ${sellerId}, ${lot.start_cents}, ${lot.reserve_cents},
            ${lot.increment_cents}, now() + (${lot.hours} * interval '1 hour'))
    returning id
  `) as { id: number }[];

  await sql`update items set status = 'auction', updated_at = now()
            where id = ${itemId} and seller_id = ${sellerId}`;

  return created[0].id;
}

/** Moves one of the seller's listings onto the block. */
export async function createAuction(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();
  if (!sellerIdVerified(seller)) {
    return { error: "Verify your ID with Stripe before this shop can sell." };
  }
  if (!isSellerVerified(seller)) {
    return {
      error: "Auctions are a Verified perk — pay $20 for 30 days on the Verified tab.",
    };
  }

  const lot = readAuctionFields(formData);
  if ("error" in lot) return { error: lot.error };
  const itemId = Number(text(formData.get("item_id")));
  if (!Number.isInteger(itemId) || itemId <= 0) return { error: "Pick a piece to auction." };

  // Only the seller's own listing, and only one that is free to auction.
  const rows = (await sql`
    select id, status from items
    where id = ${itemId} and seller_id = ${seller.id}
  `) as { id: number; status: string }[];

  const item = rows[0];
  if (!item) return { error: "That listing is not yours." };
  if (item.status === "sold") return { error: "That piece is already sold." };
  if (item.status === "auction") return { error: "That piece is already on the block." };

  const existing = (await sql`select 1 from auctions where item_id = ${itemId}`) as unknown[];
  if (existing.length > 0) {
    return { error: "That piece has been auctioned before. Duplicate it as a new listing to run it again." };
  }

  const auctionId = await insertLiveAuction(seller.id, itemId, lot);

  revalidatePath("/auctions");
  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
  redirect(`/auctions/${auctionId}`);
}

export async function cancelAuction(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return;

  // Pulling a lot with live bids on it would not be fair, so it is blocked.
  const rows = (await sql`
    select a.id, a.item_id,
           (select count(*)::int from bids b where b.auction_id = a.id) as bid_count
    from auctions a
    where a.id = ${id} and a.seller_id = ${seller.id} and a.status = 'live'
  `) as { id: number; item_id: number; bid_count: number }[];

  const auction = rows[0];
  if (!auction || auction.bid_count > 0) return;

  await sql`update auctions set status = 'cancelled', settled_at = now() where id = ${auction.id}`;
  await sql`update items set status = 'available', updated_at = now() where id = ${auction.item_id}`;

  revalidatePath("/auctions");
  revalidatePath("/dashboard/auctions");
  revalidatePath("/shop");
}

const bidSchema = z.object({
  auction_id: z.number().int().positive(),
  bidder_name: z.string().min(2, "Tell the shop who is bidding."),
  bidder_email: z.string().email("Enter a valid email so we can reach you if you win."),
  amount_cents: z.number().int().positive("Enter a bid amount."),
});

/**
 * Places a bid in a single statement. The insert only happens if the auction is
 * still live and the amount still clears the current high bid plus the
 * increment, so two people bidding at the same moment cannot both land the same
 * number.
 */
export async function placeBid(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bidSchema.safeParse({
    auction_id: Number(text(formData.get("auction_id"))),
    bidder_name: text(formData.get("bidder_name")),
    bidder_email: text(formData.get("bidder_email")).toLowerCase(),
    amount_cents: toCents(text(formData.get("amount"))) ?? -1,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const rows = (await sql.query(
    `with target as (
       select a.id, a.start_cents, a.increment_cents, a.status, a.ends_at,
              (select max(b.amount_cents) from bids b where b.auction_id = a.id) as high
       from auctions a
       where a.id = $1
       for update
     ),
     placed as (
       insert into bids (auction_id, bidder_name, bidder_email, amount_cents)
       select t.id, $2, $3, $4::int
       from target t
       where t.status = 'live'
         and t.ends_at > now()
         and $4::int >= coalesce(t.high + t.increment_cents, t.start_cents)
       returning id, amount_cents
     )
     select (select id from placed)                     as bid_id,
            (select amount_cents from placed)           as amount,
            (select status from target)                 as status,
            (select ends_at from target)                as ends_at,
            (select coalesce(high + increment_cents, start_cents) from target) as minimum`,
    [d.auction_id, d.bidder_name, d.bidder_email, d.amount_cents],
  )) as {
    bid_id: number | null;
    amount: number | null;
    status: string | null;
    ends_at: string | null;
    minimum: number | null;
  }[];

  const result = rows[0];
  if (!result?.status) return { error: "That auction no longer exists." };

  if (!result.bid_id) {
    if (result.status !== "live" || (result.ends_at && new Date(result.ends_at) <= new Date())) {
      return { error: "Bidding has closed on this lot." };
    }
    const minimum = ((result.minimum ?? 0) / 100).toFixed(2);
    return { error: `You have been outbid — the next bid has to be at least $${minimum}.` };
  }

  revalidatePath(`/auctions/${d.auction_id}`);
  revalidatePath("/auctions");
  return { ok: `Bid placed at $${((result.amount ?? 0) / 100).toFixed(2)}. You are the high bidder.` };
}

/**
 * Lets the winner reach their order without an email round trip: they type the
 * address they bid with and we hand back the order page if it matches.
 */
export async function claimAuctionWin(_prev: FormState, formData: FormData): Promise<FormState> {
  const auctionId = Number(text(formData.get("auction_id")));
  const email = text(formData.get("email")).toLowerCase();
  if (!Number.isInteger(auctionId) || auctionId <= 0) return { error: "Unknown auction." };

  const rows = (await sql`
    select o.group_token
    from auctions a
    join orders o on o.id = a.order_id
    where a.id = ${auctionId} and a.status = 'sold' and lower(o.email) = ${email}
  `) as { group_token: string | null }[];

  const token = rows[0]?.group_token;
  if (!token) {
    return { error: "That email is not the winning bid on this lot." };
  }

  redirect(`/order/${token}`);
}
