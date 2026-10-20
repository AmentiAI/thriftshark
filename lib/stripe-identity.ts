import "server-only";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { getStripe, requestOrigin, stripeConfigured } from "@/lib/stripe";
import type { Seller } from "@/lib/types";

export function sellerIdVerified(seller: { identity_status?: string | null }) {
  return (seller.identity_status ?? "verified") === "verified";
}

function mapStatus(status: Stripe.Identity.VerificationSession.Status) {
  switch (status) {
    case "verified":
      return "verified";
    case "processing":
      return "pending";
    case "requires_input":
      return "failed";
    case "canceled":
      return "required";
    default:
      return "pending";
  }
}

/** Stripe-hosted document check. New shops cannot publish until this is verified. */
export async function createSellerIdentitySession(
  seller: Seller,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (sellerIdVerified(seller)) {
    return { ok: true, url: "/dashboard" };
  }
  if (!stripeConfigured()) {
    return { ok: false, error: "Stripe is not configured on this server." };
  }

  try {
    const stripe = getStripe();
    const origin = await requestOrigin();
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        seller_id: String(seller.id),
        kind: "seller_id",
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url: `${origin}/dashboard?identity=return`,
    });

    await sql`
      update sellers set
        identity_status = 'pending',
        identity_session_id = ${session.id},
        updated_at = now()
      where id = ${seller.id}
    `;

    if (!session.url) {
      return { ok: false, error: "Stripe did not return an ID check link." };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("createSellerIdentitySession", err);
    const message = err instanceof Error ? err.message : "Could not start the ID check.";
    return { ok: false, error: message };
  }
}

export async function syncSellerIdentitySession(session: Stripe.Identity.VerificationSession) {
  const sellerId = Number(session.metadata?.seller_id);
  if (!Number.isInteger(sellerId) || sellerId <= 0) return;
  const status = mapStatus(session.status);
  await sql`
    update sellers set
      identity_status = ${status},
      identity_session_id = ${session.id},
      identity_verified_at = case
        when ${status} = 'verified' then coalesce(identity_verified_at, now())
        else identity_verified_at
      end,
      updated_at = now()
    where id = ${sellerId}
  `;
}

export async function confirmSellerIdentity(seller: Seller) {
  if (!seller.identity_session_id || !stripeConfigured() || sellerIdVerified(seller)) {
    return seller;
  }
  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.retrieve(seller.identity_session_id);
  if (Number(session.metadata?.seller_id) !== seller.id) return seller;
  await syncSellerIdentitySession(session);
  const rows = (await sql`select * from sellers where id = ${seller.id}`) as Seller[];
  return rows[0] ?? seller;
}
