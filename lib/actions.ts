"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createOrder } from "@/lib/orders";
import { endSession, isAdmin, passwordMatches, requireAdmin, startSession } from "@/lib/auth";
import {
  endSellerSession,
  hashPassword,
  requireSeller,
  startSellerSession,
  verifyPassword,
} from "@/lib/seller-auth";
import { generateCashappQr, normaliseCashtag, storeUpload } from "@/lib/images";
import { STATUSES, SELLER_SETTABLE_STATUSES, CONDITIONS } from "@/lib/types";

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

  const result = await createOrder(ids, details);
  if (!result.ok) return { error: result.error };

  revalidatePath("/shop");
  redirect(`/order/${result.groupToken}`);
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

function readImageUrls(formData: FormData) {
  return text(formData.get("image_urls"))
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s))
    .slice(0, 8);
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
  cashapp_tag: z.string().min(1, "Add your $cashtag so buyers can pay you."),
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
    cashapp_tag: text(formData.get("cashapp_tag")),
    tagline: optional(formData.get("tagline")),
    location: optional(formData.get("location")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (RESERVED_HANDLES.has(d.handle)) {
    return { error: `“${d.handle}” is reserved. Try another shop link.` };
  }

  const cashtag = normaliseCashtag(d.cashapp_tag);
  if (!cashtag) {
    return { error: "That $cashtag does not look right. Letters and numbers only." };
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

  const rows = (await sql`
    insert into sellers (handle, shop_name, email, password_hash, tagline, location, cashapp_tag)
    values (${d.handle}, ${d.shop_name}, ${d.email}, ${hashPassword(d.password)},
            ${d.tagline}, ${d.location}, ${cashtag})
    returning id
  `) as { id: number }[];

  const sellerId = rows[0].id;

  // Build their scannable Cash App code straight away so the shop can take money.
  const qrId = await generateCashappQr(cashtag, sellerId);
  if (qrId) {
    await sql`update sellers set qr_image_id = ${qrId} where id = ${sellerId}`;
  }

  await startSellerSession(sellerId);
  revalidatePath("/sellers");
  redirect("/dashboard?welcome=1");
}

export async function signInSeller(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));

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

  await startSellerSession(seller.id);
  redirect("/dashboard");
}

export async function signOutSeller() {
  await endSellerSession();
  redirect("/");
}

/* ---------- sellers: storefront settings ---------- */

const shopSchema = z.object({
  shop_name: z.string().min(2, "Give your shop a name."),
  handle: handleSchema,
  tagline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  cashapp_tag: z.string().min(1, "Buyers pay you by $cashtag, so it cannot be blank."),
});

export async function updateShop(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();

  const parsed = shopSchema.safeParse({
    shop_name: text(formData.get("shop_name")),
    handle: text(formData.get("handle")).toLowerCase().replace(/^@/, ""),
    tagline: optional(formData.get("tagline")),
    bio: optional(formData.get("bio")),
    location: optional(formData.get("location")),
    cashapp_tag: text(formData.get("cashapp_tag")),
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

  const cashtag = normaliseCashtag(d.cashapp_tag);
  if (!cashtag) {
    return { error: "That $cashtag does not look right. Letters and numbers only." };
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

  // A seller can upload the code straight from their Cash App screen; we only
  // generate one when they have not supplied their own.
  let qrId = seller.qr_image_id;
  const uploadedQr = formData.get("cashapp_qr");

  if (uploadedQr instanceof File && uploadedQr.size > 0) {
    const stored = await storeUpload(uploadedQr, seller.id, "cashapp-qr");
    if (!stored.ok) return { error: stored.error };
    qrId = stored.id;
  } else if (text(formData.get("regenerate_qr")) === "1") {
    qrId = (await generateCashappQr(cashtag, seller.id)) ?? qrId;
  } else if (!qrId) {
    qrId = (await generateCashappQr(cashtag, seller.id)) ?? qrId;
  } else if (cashtag !== seller.cashapp_tag && !seller.qr_is_custom) {
    // Cashtag changed and the code was one we generated, so refresh it.
    qrId = (await generateCashappQr(cashtag, seller.id)) ?? qrId;
  }

  const qrIsCustom =
    uploadedQr instanceof File && uploadedQr.size > 0
      ? true
      : text(formData.get("regenerate_qr")) === "1"
        ? false
        : seller.qr_is_custom;

  await sql`
    update sellers set
      shop_name = ${d.shop_name}, handle = ${d.handle}, tagline = ${d.tagline},
      bio = ${d.bio}, location = ${d.location}, cashapp_tag = ${cashtag},
      logo_image_id = ${logoId}, banner_image_id = ${bannerId}, qr_image_id = ${qrId},
      qr_is_custom = ${qrIsCustom}, updated_at = now()
    where id = ${seller.id}
  `;

  revalidatePath("/sellers");
  revalidatePath(`/shop/${d.handle}`);
  revalidatePath("/");
  return { ok: "Storefront saved." };
}

/* ---------- sellers: their own listings ---------- */

async function readPhotos(formData: FormData, sellerId: number) {
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 6);

  const ids: number[] = [];
  for (const file of files) {
    const stored = await storeUpload(file, sellerId, "item");
    if (!stored.ok) return { ok: false as const, error: stored.error };
    ids.push(stored.id);
  }
  return { ok: true as const, ids };
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();

  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.status === "auction") {
    return { error: "Start an auction from the Auctions tab, not from the status field." };
  }

  const photos = await readPhotos(formData, seller.id);
  if (!photos.ok) return { error: photos.error };

  const urls = readImageUrls(formData);
  if (photos.ids.length === 0 && urls.length === 0) {
    return { error: "Add at least one photo — nothing sells without one." };
  }

  const slug = await uniqueSlug(d.title);
  const rows = (await sql`
    insert into items (slug, title, description, price_cents, compare_at_cents, category_id,
                       brand, item_size, condition, color, status, featured, seller_id)
    values (${slug}, ${d.title}, ${d.description}, ${d.price_cents}, ${d.compare_at_cents},
            ${d.category_id}, ${d.brand}, ${d.item_size}, ${d.condition}, ${d.color},
            ${d.status}, false, ${seller.id})
    returning id
  `) as { id: number }[];

  const id = rows[0].id;
  let position = 0;
  for (const imageId of photos.ids) {
    await sql`insert into item_images (item_id, image_id, alt, position)
              values (${id}, ${imageId}, ${d.title}, ${position++})`;
  }
  for (const url of urls) {
    await sql`insert into item_images (item_id, url, alt, position)
              values (${id}, ${url}, ${d.title}, ${position++})`;
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/shop/${seller.handle}`);
  redirect(`/dashboard/items/${id}?saved=1`);
}

export async function updateListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return { error: "Unknown listing." };

  // Ownership is checked in the statement itself, not just in the page.
  const owned = (await sql`
    select status from items where id = ${id} and seller_id = ${seller.id}
  `) as { status: string }[];
  if (owned.length === 0) return { error: "That listing is not yours." };

  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Mid-auction, the lot owns the status: keep whatever it already is.
  const onBlock = owned[0].status === "auction";
  const status = onBlock ? "auction" : d.status === "auction" ? "available" : d.status;

  const photos = await readPhotos(formData, seller.id);
  if (!photos.ok) return { error: photos.error };
  const urls = readImageUrls(formData);

  const slug = await uniqueSlug(d.title, id);
  await sql`
    update items set
      slug = ${slug}, title = ${d.title}, description = ${d.description},
      price_cents = ${d.price_cents}, compare_at_cents = ${d.compare_at_cents},
      category_id = ${d.category_id}, brand = ${d.brand}, item_size = ${d.item_size},
      condition = ${d.condition}, color = ${d.color}, status = ${status},
      updated_at = now()
    where id = ${id} and seller_id = ${seller.id}
  `;

  // New photos replace the old set; sending none keeps what is there.
  if (photos.ids.length > 0 || urls.length > 0) {
    await sql`delete from item_images where item_id = ${id}`;
    let position = 0;
    for (const imageId of photos.ids) {
      await sql`insert into item_images (item_id, image_id, alt, position)
                values (${id}, ${imageId}, ${d.title}, ${position++})`;
    }
    for (const url of urls) {
      await sql`insert into item_images (item_id, url, alt, position)
                values (${id}, ${url}, ${d.title}, ${position++})`;
    }
  }

  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
  revalidatePath(`/item/${slug}`);
  return { ok: "Listing saved." };
}

export async function deleteListing(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  if (Number.isInteger(id) && id > 0) {
    await sql`delete from items where id = ${id} and seller_id = ${seller.id}`;
  }
  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
  redirect("/dashboard/items");
}

export async function setListingStatus(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  if (Number.isInteger(id) && id > 0 && (SELLER_SETTABLE_STATUSES as string[]).includes(status)) {
    // An item in a live auction stays put until the lot closes.
    await sql`update items set status = ${status}, updated_at = now()
              where id = ${id} and seller_id = ${seller.id} and status <> 'auction'`;
  }
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

/* ---------- auction house ---------- */

const auctionSchema = z.object({
  item_id: z.number().int().positive(),
  start_cents: z.number().int().min(100, "Start the bidding at $1 or more."),
  reserve_cents: z.number().int().min(0).nullable(),
  increment_cents: z.number().int().min(50, "Bid increments start at 50c."),
  hours: z.number().int().min(1).max(336),
});

/** Moves one of the seller's listings onto the block. */
export async function createAuction(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await requireSeller();

  const parsed = auctionSchema.safeParse({
    item_id: Number(text(formData.get("item_id"))),
    start_cents: toCents(text(formData.get("start_price"))) ?? -1,
    reserve_cents: text(formData.get("reserve_price"))
      ? toCents(text(formData.get("reserve_price")))
      : null,
    increment_cents: toCents(text(formData.get("increment"))) ?? 100,
    hours: Number(text(formData.get("hours"))) || 72,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.reserve_cents !== null && d.reserve_cents < d.start_cents) {
    return { error: "A reserve below the starting bid does nothing — raise it or clear it." };
  }

  // Only the seller's own listing, and only one that is free to auction.
  const rows = (await sql`
    select id, status from items
    where id = ${d.item_id} and seller_id = ${seller.id}
  `) as { id: number; status: string }[];

  const item = rows[0];
  if (!item) return { error: "That listing is not yours." };
  if (item.status === "sold") return { error: "That piece is already sold." };
  if (item.status === "auction") return { error: "That piece is already on the block." };

  const existing = (await sql`select 1 from auctions where item_id = ${d.item_id}`) as unknown[];
  if (existing.length > 0) {
    return { error: "That piece has been auctioned before. Duplicate it as a new listing to run it again." };
  }

  const created = (await sql`
    insert into auctions (item_id, seller_id, start_cents, reserve_cents,
                          increment_cents, ends_at)
    values (${d.item_id}, ${seller.id}, ${d.start_cents}, ${d.reserve_cents},
            ${d.increment_cents}, now() + (${d.hours} * interval '1 hour'))
    returning id
  `) as { id: number }[];

  await sql`update items set status = 'auction', updated_at = now() where id = ${d.item_id}`;

  revalidatePath("/auctions");
  revalidatePath("/shop");
  revalidatePath(`/shop/${seller.handle}`);
  redirect(`/auctions/${created[0].id}`);
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
