import "server-only";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { getStripe, requestOrigin, stripeConfigured } from "@/lib/stripe";
import {
  SELLER_PLAN_PRICE_USD,
  VERIFIED_PASS_DAYS,
  type SubscriptionStatus,
} from "@/lib/seller-plan";
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

/**
 * One-time $20 Checkout for 30 days of Verified. Paying again stacks another
 * 30 days onto whatever time is left.
 */
export async function createVerifiedPassCheckout(
  seller: Seller,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (seller.official) {
    return { ok: false, error: "This shop is Verified by the platform — no payment needed." };
  }
  if (!stripeConfigured()) {
    return { ok: false, error: "Stripe is not configured on this server." };
  }

  try {
    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(seller);
    const origin = await requestOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: SELLER_PLAN_PRICE_USD * 100,
            product_data: {
              name: `Verified — ${VERIFIED_PASS_DAYS} days`,
              description: "Badge, auctions, extra photos, and the rest of the Verified perks.",
            },
          },
        },
      ],
      success_url: `${origin}/dashboard/verified?plan=done&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/verified?plan=cancel`,
      metadata: {
        kind: "verified_pass",
        seller_id: String(seller.id),
        handle: seller.handle,
      },
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("createVerifiedPassCheckout", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return { ok: false, error: message };
  }
}

/** Apply a paid Checkout once. A repeated webhook does not add another 30 days. */
export async function grantVerifiedPass(sellerId: number, sessionId: string) {
  const inserted = (await sql`
    insert into verified_payments (seller_id, stripe_session_id)
    values (${sellerId}, ${sessionId})
    on conflict (stripe_session_id) do nothing
    returning id
  `) as { id: number }[];
  if (!inserted[0]) return false;

  await sql`
    update sellers set
      verified_until = greatest(coalesce(verified_until, now()), now())
        + (${VERIFIED_PASS_DAYS}::int * interval '1 day'),
      verified_reminded_for = null,
      subscription_status = 'active',
      subscription_current_period_end = greatest(coalesce(verified_until, now()), now())
        + (${VERIFIED_PASS_DAYS}::int * interval '1 day'),
      updated_at = now()
    where id = ${sellerId}
  `;
  return true;
}

/** Confirm a return from Checkout in case the webhook has not landed yet. */
export async function confirmVerifiedPassCheckout(seller: Seller, sessionId: string) {
  if (!sessionId || !stripeConfigured()) return seller;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== "verified_pass") return seller;
  if (Number(session.metadata.seller_id) !== seller.id) return seller;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return seller;
  }
  await grantVerifiedPass(seller.id, session.id);
  const rows = (await sql`select * from sellers where id = ${seller.id}`) as Seller[];
  return rows[0] ?? seller;
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
  const keepUntil =
    (status === "active" || status === "trialing") && periodEnd ? periodEnd : null;

  // Old $20/mo subscriptions stop renewing. Time already paid stays; after
  // that they buy another 30 days from the Verified tab.
  if ((status === "active" || status === "trialing") && !sub.cancel_at_period_end) {
    try {
      await getStripe().subscriptions.update(sub.id, { cancel_at_period_end: true });
    } catch (err) {
      console.error("cancel verified subscription at period end", err);
    }
  }

  if (Number.isInteger(sellerIdMeta) && sellerIdMeta > 0) {
    await sql`
      update sellers set
        stripe_customer_id = coalesce(${customerId}, stripe_customer_id),
        stripe_subscription_id = ${sub.id},
        subscription_status = ${status},
        subscription_current_period_end = ${periodEnd},
        verified_until = case
          when ${keepUntil}::timestamptz is null then verified_until
          else greatest(coalesce(verified_until, ${keepUntil}::timestamptz), ${keepUntil}::timestamptz)
        end,
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
        verified_until = case
          when ${keepUntil}::timestamptz is null then verified_until
          else greatest(coalesce(verified_until, ${keepUntil}::timestamptz), ${keepUntil}::timestamptz)
        end,
        updated_at = now()
      where stripe_customer_id = ${customerId}
    `;
    return;
  }

  await sql`
    update sellers set
      subscription_status = ${status},
      subscription_current_period_end = ${periodEnd},
      verified_until = case
        when ${keepUntil}::timestamptz is null then verified_until
        else greatest(coalesce(verified_until, ${keepUntil}::timestamptz), ${keepUntil}::timestamptz)
      end,
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
