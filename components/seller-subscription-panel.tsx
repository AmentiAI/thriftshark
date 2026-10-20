import Link from "next/link";
import { startSellerSubscription } from "@/lib/actions";
import {
  FREE_LISTING_PHOTOS,
  FREE_MAX_LIVE_LISTINGS,
  SELLER_PLAN_PRICE_USD,
  VERIFIED_LISTING_PHOTOS,
  VERIFIED_PASS_DAYS,
  VERIFIED_SPOTLIGHT_CAP,
  sellerPlanConfigured,
} from "@/lib/seller-plan";
import { VerifiedBadge } from "@/components/verified-badge";
import type { ShopSettings } from "@/lib/types";
import { shortDate } from "@/lib/format";

const PERKS = [
  "Verified badge on your shop and listings",
  "No $5 platform fee when you buy",
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
  const until = seller.verified_until ? new Date(seller.verified_until) : null;
  const hoursLeft =
    until && active ? (until.getTime() - Date.now()) / (1000 * 60 * 60) : null;
  const endingSoon = hoursLeft !== null && hoursLeft <= 24;

  return (
    <section className="panel mb-8 space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            Verified
            {active && <VerifiedBadge />}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
            ${SELLER_PLAN_PRICE_USD} for {VERIFIED_PASS_DAYS} days. When it ends,
            the badge and perks drop until you pay again.
          </p>
        </div>
        {official ? (
          <span className="shrink-0 rounded-full bg-reef/15 px-3 py-1 text-xs font-bold uppercase text-reef">
            Official
          </span>
        ) : endingSoon ? (
          <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase text-ink">
            Ends soon
          </span>
        ) : active ? (
          <span className="shrink-0 rounded-full bg-reef/15 px-3 py-1 text-xs font-bold uppercase text-reef">
            Active
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-paper-dim px-3 py-1 text-xs font-bold uppercase text-ink-soft">
            Not verified
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

      {active && until && !official && (
        <p className="text-sm text-ink-soft">
          {endingSoon
            ? `Ends ${shortDate(until.toISOString())} — pay now to keep Verified.`
            : `Active through ${shortDate(until.toISOString())}. Paying again adds another ${VERIFIED_PASS_DAYS} days.`}
        </p>
      )}

      {!active && !official && until && (
        <p className="text-sm text-ink-soft">
          Last pass ended {shortDate(until.toISOString())}. Pay to turn Verified
          back on.
        </p>
      )}

      {official ? (
        <p className="text-sm text-ink-soft">
          This shop was verified by Thrift Sharks — it does not expire or bill.
        </p>
      ) : !configured ? (
        <p className="text-sm text-coral">
          Card checkout is not configured. Add{" "}
          <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> and redeploy.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <form action={startSellerSubscription}>
            <button type="submit" className="btn btn-ink">
              {active
                ? `Add ${VERIFIED_PASS_DAYS} days — $${SELLER_PLAN_PRICE_USD}`
                : `Get Verified — $${SELLER_PLAN_PRICE_USD}`}
            </button>
          </form>
          <Link href="/sell" className="btn btn-ghost">
            What’s included
          </Link>
        </div>
      )}
    </section>
  );
}
