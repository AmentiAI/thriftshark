import "server-only";
import { sql } from "@/lib/db";
import { getStripe, siteUrl } from "@/lib/stripe";
import { PLATFORM_FEE_CENTS, type Order } from "@/lib/types";

/** Pull charges/payouts flags from Stripe onto the seller row. */
export async function syncSellerFromStripeAccount(accountId: string) {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  await sql`
    update sellers set
      stripe_charges_enabled = ${Boolean(account.charges_enabled)},
      stripe_payouts_enabled = ${Boolean(account.payouts_enabled)},
      updated_at = now()
    where stripe_account_id = ${accountId}
  `;
  return account;
}

/**
 * Direct-charge Checkout Session on the seller's Express account.
 * Buyer pays the full total; platform_fee_cents is taken as an application fee
 * so the seller receives subtotal + shipping.
 */
export async function createCheckoutSessionForOrder(order: Order) {
  if (!order.seller_stripe_account_id || !order.seller_stripe_charges_enabled) {
    return { ok: false as const, error: "This shop is not ready for card checkout yet." };
  }
  if (order.payment_status === "paid") {
    return { ok: false as const, error: "This order is already paid." };
  }
  if (order.total_cents < 50) {
    return { ok: false as const, error: "Stripe needs at least $0.50 per charge." };
  }

  const feeCents = order.platform_fee_cents > 0 ? order.platform_fee_cents : PLATFORM_FEE_CENTS;
  if (feeCents >= order.total_cents) {
    return { ok: false as const, error: "Order total is too small for the platform fee." };
  }

  const stripe = getStripe();
  const base = siteUrl();
  const lineName =
    order.lines.length === 1
      ? order.lines[0].title
      : `${order.seller_shop_name ?? "Shop"} · ${order.order_number}`;
  const merchandiseCents = order.total_cents - feeCents;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: order.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: merchandiseCents,
            product_data: {
              name: lineName,
              description: `Order ${order.order_number}`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: feeCents,
            product_data: {
              name: "Platform fee",
              description: "Keeps Thrift Sharks running",
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents,
      },
      success_url: `${base}/order/${order.group_token ?? order.order_number}?paid=1`,
      cancel_url: `${base}/order/${order.group_token ?? order.order_number}?cancelled=1`,
      metadata: {
        order_id: String(order.id),
        order_number: order.order_number,
        group_token: order.group_token ?? "",
        platform_fee_cents: String(feeCents),
      },
    },
    { stripeAccount: order.seller_stripe_account_id },
  );

  if (!session.url) {
    return { ok: false as const, error: "Stripe did not return a checkout URL." };
  }

  await sql`
    update orders
    set stripe_checkout_session_id = ${session.id}
    where id = ${order.id}
  `;

  return { ok: true as const, url: session.url, sessionId: session.id };
}

export async function markOrderPaidFromCheckout(opts: {
  orderId: number;
  sessionId: string;
  paymentIntentId: string | null;
}) {
  await sql`
    update orders set
      payment_status = 'paid',
      stripe_checkout_session_id = coalesce(stripe_checkout_session_id, ${opts.sessionId}),
      stripe_payment_intent_id = coalesce(${opts.paymentIntentId}, stripe_payment_intent_id)
    where id = ${opts.orderId}
      and payment_status = 'pending'
  `;
}
