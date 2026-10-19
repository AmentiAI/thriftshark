import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import {
  markOrderPaidFromCheckout,
  syncSellerFromStripeAccount,
} from "@/lib/stripe-connect";

export const runtime = "nodejs";

/**
 * Stripe webhook. Source of truth for paid orders and Connect account status.
 * Local: `stripe listen --forward-to localhost:PORT/api/stripe/webhook
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
        if (session.mode !== "payment") break;
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
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
          await sql`
            update orders set
              payment_status = 'paid',
              stripe_payment_intent_id = coalesce(${paymentIntent}, stripe_payment_intent_id)
            where stripe_checkout_session_id = ${session.id}
              and payment_status = 'pending'
          `;
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.id) {
          await syncSellerFromStripeAccount(account.id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler failed", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
