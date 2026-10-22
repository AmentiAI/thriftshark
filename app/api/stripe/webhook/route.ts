import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { noticeOrderPaid } from "@/lib/notices";
import { getStripe } from "@/lib/stripe";
import {
  markOrderPaidFromCheckout,
  syncSellerFromStripeAccount,
} from "@/lib/stripe-connect";
import {
  grantBuyerVerified,
  grantVerifiedPass,
  syncSellerSubscription,
  syncSellerSubscriptionFromCheckout,
} from "@/lib/stripe-billing";
import { syncSellerIdentitySession } from "@/lib/stripe-identity";

export const runtime = "nodejs";

/**
 * Stripe webhook. Source of truth for paid orders, Connect status, and the
 * Verified seller subscription. Local:
 * `stripe listen --forward-to localhost:PORT/api/stripe/webhook
 *         --forward-connect-to localhost:PORT/api/stripe/webhook`
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await syncSellerSubscriptionFromCheckout(session);
          break;
        }
        if (session.mode !== "payment") break;
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
          break;
        }

        if (session.metadata?.kind === "verified_pass") {
          const sellerId = Number(session.metadata.seller_id);
          if (Number.isInteger(sellerId) && sellerId > 0 && session.id) {
            await grantVerifiedPass(sellerId, session.id);
          }
          break;
        }

        if (session.metadata?.kind === "buyer_verified") {
          const buyerId = Number(session.metadata.buyer_id);
          if (Number.isInteger(buyerId) && buyerId > 0 && session.id) {
            await grantBuyerVerified(buyerId, session.id);
          }
          break;
        }

        const orderId = Number(session.metadata?.order_id);
        const paymentIntent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        if (Number.isInteger(orderId) && orderId > 0) {
          await markOrderPaidFromCheckout({
            orderId,
            sessionId: session.id,
            paymentIntentId: paymentIntent,
          });
        } else if (session.id) {
          const paid = (await sql`
            update orders set
              payment_status = 'paid',
              stripe_payment_intent_id = coalesce(${paymentIntent}, stripe_payment_intent_id)
            where stripe_checkout_session_id = ${session.id}
              and payment_status = 'pending'
            returning id
          `) as { id: number }[];
          for (const order of paid) await noticeOrderPaid(order.id);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSellerSubscription(sub);
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.id) {
          await syncSellerFromStripeAccount(account.id);
        }
        break;
      }

      default: {
        if (event.type.startsWith("identity.verification_session.")) {
          await syncSellerIdentitySession(
            event.data.object as Stripe.Identity.VerificationSession,
          );
        }
        break;
      }
    }
  } catch (err) {
    console.error("stripe webhook handler failed", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
