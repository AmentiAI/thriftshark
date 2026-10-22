import "server-only";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { noticeOrderPaid } from "@/lib/notices";
import {
  applyThriftSharksAccountBranding,
  checkoutBrandingSettings,
  getStripe,
  publicBusinessUrl,
  requestOrigin,
  siteUrl,
  stripeConfigured,
  thriftSharksIconFileId,
} from "@/lib/stripe";
import { type Order, type Seller } from "@/lib/types";

function stripeErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message: unknown }).message);
    if (message) return message;
  }
  return "Stripe could not start onboarding. Try again in a moment.";
}

/**
 * Create (or resume) Express onboarding for a seller.
 * Lives outside `"use server"` so pages can call it without crashing the RSC.
 */
export async function createSellerAccountLink(seller: Seller) {
  if (!stripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured on this server." };
  }

  const stripe = getStripe();
  const base = await requestOrigin();
  let accountId = seller.stripe_account_id;

  try {
    if (!accountId) {
      const shopUrl = publicBusinessUrl(`/shop/${seller.handle}`);
      // Matches Connect platform profile:
      // Platform + Express Dashboard + application fees + Managed Risk (Stripe
      // covers connected-account negative balances) + direct charges.
      let account;
      try {
        account = await stripe.accounts.create({
          country: "US",
          email: seller.email,
          controller: {
            stripe_dashboard: { type: "express" },
            // Connected account pays Stripe processing fees; we take app fees.
            fees: { payer: "account" },
            // Managed Risk — Stripe responsibility for negative balances.
            losses: { payments: "stripe" },
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: seller.shop_name,
            product_description: BRAND.productDescription,
            ...(shopUrl ? { url: shopUrl } : {}),
          },
          metadata: {
            seller_id: String(seller.id),
            handle: seller.handle,
            platform: BRAND.name,
          },
        });
      } catch {
        // Older platforms / GA API: classic Express accounts.
        account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: seller.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: seller.shop_name,
            product_description: BRAND.productDescription,
            ...(shopUrl ? { url: shopUrl } : {}),
          },
          metadata: {
            seller_id: String(seller.id),
            handle: seller.handle,
            platform: BRAND.name,
          },
        });
      }

      accountId = account.id;
      await sql`
        update sellers
        set stripe_account_id = ${accountId}, updated_at = now()
        where id = ${seller.id} and stripe_account_id is null
      `;
      // Another request may have won the race — re-read the stored id.
      const rows = (await sql`
        select stripe_account_id from sellers where id = ${seller.id}
      `) as { stripe_account_id: string | null }[];
      accountId = rows[0]?.stripe_account_id ?? accountId;

      try {
        await applyThriftSharksAccountBranding(accountId!);
      } catch (err) {
        console.error("account branding failed", err);
      }
    } else {
      const account = await stripe.accounts.retrieve(accountId);
      await syncSellerFromStripeAccount(accountId);
      if (account.details_submitted && account.charges_enabled) {
        return {
          ok: true as const,
          done: true as const,
          url: `${base}/dashboard/shop?stripe=done`,
        };
      }
    }

    const link = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: `${base}/dashboard/shop?stripe=refresh`,
      return_url: `${base}/dashboard/shop?stripe=done`,
      type: "account_onboarding",
    });

    if (!link.url) {
      return { ok: false as const, error: "Stripe did not return an onboarding URL." };
    }

    return { ok: true as const, done: false as const, url: link.url };
  } catch (err) {
    console.error("createSellerAccountLink failed", err);
    return { ok: false as const, error: stripeErrorMessage(err) };
  }
}

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
 * so the seller receives item subtotal + shipping.
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

  const feeCents = Math.max(0, order.platform_fee_cents ?? 0);
  if (feeCents > 0 && feeCents >= order.total_cents) {
    return { ok: false as const, error: "Order total is too small for the platform fee." };
  }

  const stripe = getStripe();
  const base = siteUrl();
  const lineName =
    order.lines.length === 1
      ? order.lines[0].title
      : `${order.seller_shop_name ?? "Shop"} · ${order.order_number}`;
  const merchandiseCents = order.total_cents - feeCents;
  const iconFileId = await thriftSharksIconFileId();
  const branding = checkoutBrandingSettings(order.seller_shop_name);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: merchandiseCents,
        product_data: {
          name: lineName,
          description: `${BRAND.name} order ${order.order_number}`,
        },
      },
    },
  ];
  if (feeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: feeCents,
        product_data: {
          name: `${BRAND.name} platform fee`,
          description: "Keeps the marketplace running",
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: order.email,
      line_items: lineItems,
      payment_intent_data: {
        ...(feeCents > 0 ? { application_fee_amount: feeCents } : {}),
        statement_descriptor_suffix: "THRIFTSHARK",
      },
      branding_settings: {
        ...branding,
        ...(iconFileId
          ? { icon: { type: "file" as const, file: iconFileId } }
          : {}),
      },
      custom_text: {
        submit: {
          message: `Paying ${order.seller_shop_name ?? "the seller"} on ${BRAND.name}.`,
        },
      },
      success_url: `${base}/order/${order.group_token ?? order.order_number}?paid=1`,
      cancel_url: `${base}/order/${order.group_token ?? order.order_number}?cancelled=1`,
      metadata: {
        order_id: String(order.id),
        order_number: order.order_number,
        group_token: order.group_token ?? "",
        platform_fee_cents: String(feeCents),
        platform: BRAND.name,
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
  const paid = (await sql`
    update orders set
      payment_status = 'paid',
      stripe_checkout_session_id = coalesce(stripe_checkout_session_id, ${opts.sessionId}),
      stripe_payment_intent_id = coalesce(${opts.paymentIntentId}, stripe_payment_intent_id)
    where id = ${opts.orderId}
      and payment_status = 'pending'
    returning id
  `) as { id: number }[];
  for (const order of paid) await noticeOrderPaid(order.id);
}
