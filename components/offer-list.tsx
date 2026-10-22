"use client";

import Link from "next/link";
import { useActionState } from "react";
import { acceptOffer, declineOffer, type FormState } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import type { ListingOffer } from "@/lib/queries";

function OfferActions({ offerId }: { offerId: number }) {
  const [acceptState, accept, acceptPending] = useActionState<FormState, FormData>(acceptOffer, null);
  const [declineState, decline, declinePending] = useActionState<FormState, FormData>(declineOffer, null);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={accept}>
        <input type="hidden" name="offer_id" value={offerId} />
        <button disabled={acceptPending || declinePending} className="btn btn-ink !px-3.5 !py-2 text-sm">
          {acceptPending ? "Confirming…" : "Confirm"}
        </button>
      </form>
      <form action={decline}>
        <input type="hidden" name="offer_id" value={offerId} />
        <button disabled={acceptPending || declinePending} className="btn btn-ghost !px-3.5 !py-2 text-sm">
          {declinePending ? "Denying…" : "Deny"}
        </button>
      </form>
      {(acceptState?.error || declineState?.error) && (
        <p className="basis-full text-sm text-coral">{acceptState?.error || declineState?.error}</p>
      )}
      {acceptState?.ok && <p className="basis-full text-sm font-medium">{acceptState.ok}</p>}
    </div>
  );
}

export function OfferList({ offers }: { offers: ListingOffer[] }) {
  if (offers.length === 0) {
    return (
      <p className="border border-line px-5 py-10 text-center text-sm text-ink-soft">
        No offers waiting. They show up here when someone offers under your price.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {offers.map((offer) => (
        <li key={offer.id} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link href={`/item/${offer.item_slug}`} className="min-w-0 font-semibold underline">
              {offer.item_title}
            </Link>
            <p className="text-xs text-ink-faint">{shortDate(offer.created_at)}</p>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {offer.from_name} offered <strong className="text-ink">{money(offer.amount_cents)}</strong>
            {" · listed at "}
            {money(offer.price_cents)}
          </p>
          {offer.note && <p className="mt-1 break-anywhere text-sm text-ink-soft">{offer.note}</p>}
          <OfferActions offerId={offer.id} />
        </li>
      ))}
    </ul>
  );
}
