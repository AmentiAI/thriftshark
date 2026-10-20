import Link from "next/link";
import {
  openSellerBillingPortal,
  startSellerSubscription,
} from "@/lib/actions";
import {
  FREE_LISTING_PHOTOS,
  FREE_MAX_LIVE_LISTINGS,
  SELLER_PLAN_PRICE_USD,
  VERIFIED_LISTING_PHOTOS,
  VERIFIED_SPOTLIGHT_CAP,
  sellerPlanConfigured,
} from "@/lib/seller-plan";
import { VerifiedBadge } from "@/components/verified-badge";
import type { ShopSettings } from "@/lib/types";
import { shortDate } from "@/lib/format";

const PERKS = [
  "Verified badge on your shop and listings",
  "Auction house access",
  `Up to ${VERIFIED_LISTING_PHOTOS} photos per listing (free: ${FREE_LISTING_PHOTOS})`,
  `Unlimited live listings (free shops cap at ${FREE_MAX_LIVE_LISTINGS})`,
  `Up to ${VERIFIED_SPOTLIGHT_CAP} homepage spotlights`,
  "Sale “was” pricing on listings",
  "Priority in shop search, fresh drops, and the shops rail",
  "Shop insights on your dashboard (7-day sales, rack value)",
];

export function SellerSubscriptionPanel({
  seller,
  notice,
}: {
  seller: ShopSettings;
  notice?: string | null;
}) {
  const configured = sellerPlanConfigured();
  const active = seller.verified;
  const official = seller.official;
  const pastDue = seller.subscription_status === "past_due";

  return (
    <section className="panel mb-8 space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            Verified plan
            {active && <VerifiedBadge />}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
            ${SELLER_PLAN_PRICE_USD}/month. Sell free forever — Verified adds trust
            and tools that help shops move more pieces.
          </p>
        </div>
        {official ? (
          <span className="shrink-0 rounded-full bg-reef/15 px-3 py-1 text-xs font-bold uppercase text-reef">
            Official
          </span>
        ) : active ? (
          <span className="shrink-0 rounded-full bg-reef/15 px-3 py-1 text-xs font-bold uppercase text-reef">
            Active
          </span>
        ) : pastDue ? (
          <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase text-ink">
            Past due
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-paper-dim px-3 py-1 text-xs font-bold uppercase text-ink-soft">
            Optional
          </span>
        )}
      </div>

      {notice && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            notice.toLowerCase().includes("could not") ||
            notice.toLowerCase().includes("missing") ||
            notice.toLowerCase().includes("error") ||
            notice.toLowerCase().includes("cancel")
              ? "bg-coral/10 text-ink"
              : "bg-reef/10 text-ink"
          }`}
        >
          {notice}
        </p>
      )}

      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {PERKS.map((perk) => (
          <li
            key={perk}
            className="rounded-2xl bg-paper-dim px-4 py-3 text-ink-soft"
          >
            {perk}
          </li>
        ))}
      </ul>

      {active && seller.subscription_current_period_end && (
        <p className="text-xs text-ink-faint">
          Renews {shortDate(seller.subscription_current_period_end)}. Manage card
          or cancel anytime in Stripe’s billing portal.
        </p>
      )}

      {official ? (
        <p className="text-sm text-ink-soft">
          This is the platform shop — Verified is included and does not bill.
        </p>
      ) : !configured ? (
        <p className="text-sm text-coral">
          Plan checkout is not configured. Add{" "}
          <code className="font-mono text-xs">STRIPE_SELLER_PLAN_PRICE_ID</code>{" "}
          (a $20/mo Price in Stripe) and redeploy.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {!active && (
            <form action={startSellerSubscription}>
              <button type="submit" className="btn btn-ink">
                Get Verified — ${SELLER_PLAN_PRICE_USD}/mo
              </button>
            </form>
          )}
          {(active || pastDue || seller.subscription_status !== "none") && (
            <form action={openSellerBillingPortal}>
              <button type="submit" className="btn btn-ghost">
                Manage billing
              </button>
            </form>
          )}
          {!active && (
            <Link href="/sell" className="btn btn-ghost">
              What’s included
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
