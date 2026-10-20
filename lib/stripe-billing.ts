import "server-only";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { getStripe, requestOrigin, stripeConfigured } from "@/lib/stripe";
import { sellerPlanPriceId, type SubscriptionStatus } from "@/lib/seller-plan";
import type { Seller } from "@/lib/types";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "none";
  }
}

/** Preview API moved period bounds onto subscription items. */
function periodEndIso(sub: Stripe.Subscription): string | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

/** Ensure the seller has a Stripe Customer on the platform account. */
async function ensureStripeCustomer(seller: Seller): Promise<string> {
  if (seller.stripe_customer_id) return seller.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: seller.email,
    name: seller.shop_name,
    metadata: { seller_id: String(seller.id), handle: seller.handle },
  });

  await sql`
    update sellers
    set stripe_customer_id = ${customer.id}, updated_at = now()
    where id = ${seller.id} and stripe_customer_id is null
  `;

  return customer.id;
}

/** Open Stripe Checkout for the $20/mo Verified seller plan. */
export async function createSellerSubscriptionCheckout(
  seller: Seller,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!stripeConfigured()) {
    return { ok: false, error: "Stripe is not configured on this server." };
  }
  const priceId = sellerPlanPriceId();
  if (!priceId) {
    return {
      ok: false,
      error: "Seller plan price is missing. Set STRIPE_SELLER_PLAN_PRICE_ID.",
    };
  }

  if (seller.subscription_status === "active" || seller.subscription_status === "trialing") {
    return { ok: false, error: "Your shop is already on the Verified plan." };
  }

  try {
    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(seller);
    const origin = await requestOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/shop?plan=done`,
      cancel_url: `${origin}/dashboard/shop?plan=cancel`,
      allow_promotion_codes: true,
      metadata: { seller_id: String(seller.id) },
      subscription_data: {
        metadata: { seller_id: String(seller.id), handle: seller.handle },
      },
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("createSellerSubscriptionCheckout", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return { ok: false, error: message };
  }
}

/** Stripe Customer Portal — cancel, update card, invoices. */
export async function createSellerBillingPortal(
  seller: Seller,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!stripeConfigured()) {
    return { ok: false, error: "Stripe is not configured on this server." };
  }
  if (!seller.stripe_customer_id) {
    return { ok: false, error: "No billing account yet — subscribe first." };
  }

  try {
    const stripe = getStripe();
    const origin = await requestOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: seller.stripe_customer_id,
      return_url: `${origin}/dashboard/shop`,
    });
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("createSellerBillingPortal", err);
    const message = err instanceof Error ? err.message : "Could not open billing portal.";
    return { ok: false, error: message };
  }
}

/** Persist subscription state onto the seller row. */
export async function syncSellerSubscription(sub: Stripe.Subscription) {
  const status = mapSubscriptionStatus(sub.status);
  const periodEnd = periodEndIso(sub);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const sellerIdMeta = Number(sub.metadata?.seller_id);

  if (Number.isInteger(sellerIdMeta) && sellerIdMeta > 0) {
    await sql`
      update sellers set
        stripe_customer_id = coalesce(${customerId}, stripe_customer_id),
        stripe_subscription_id = ${sub.id},
        subscription_status = ${status},
        subscription_current_period_end = ${periodEnd},
        updated_at = now()
      where id = ${sellerIdMeta}
    `;
    return;
  }

  if (customerId) {
    await sql`
      update sellers set
        stripe_subscription_id = ${sub.id},
        subscription_status = ${status},
        subscription_current_period_end = ${periodEnd},
        updated_at = now()
      where stripe_customer_id = ${customerId}
    `;
    return;
  }

  await sql`
    update sellers set
      subscription_status = ${status},
      subscription_current_period_end = ${periodEnd},
      updated_at = now()
    where stripe_subscription_id = ${sub.id}
  `;
}

/** After Checkout completes, pull the Subscription and sync. */
export async function syncSellerSubscriptionFromCheckout(
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") return;

  const subRef = session.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);

  const sellerId = Number(session.metadata?.seller_id ?? sub.metadata?.seller_id);
  if (Number.isInteger(sellerId) && sellerId > 0 && !sub.metadata?.seller_id) {
    await stripe.subscriptions.update(subId, {
      metadata: { ...sub.metadata, seller_id: String(sellerId) },
    });
    sub.metadata = { ...sub.metadata, seller_id: String(sellerId) };
  }

  await syncSellerSubscription(sub);
}

/** Refresh from Stripe when the seller returns from Checkout. */
export async function refreshSellerSubscription(seller: Seller) {
  if (!seller.stripe_subscription_id || !stripeConfigured()) return seller;
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(seller.stripe_subscription_id);
  await syncSellerSubscription(sub);
  const rows = (await sql`
    select * from sellers where id = ${seller.id}
  `) as Seller[];
  return rows[0] ?? seller;
}
