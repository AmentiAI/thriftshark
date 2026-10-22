"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitOffer, type FormState } from "@/lib/actions";
import { money } from "@/lib/format";

export function OfferForm({
  itemId,
  slug,
  listedCents,
  signedIn,
  offer,
}: {
  itemId: number;
  slug: string;
  listedCents: number;
  signedIn: boolean;
  offer: { amount_cents: number; status: string } | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitOffer, null);
  const [open, setOpen] = useState(offer?.status === "pending" || offer?.status === "declined");

  if (!signedIn) {
    return (
      <div>
        <Link href={`/login?next=/item/${slug}`} className="btn btn-ghost w-full">
          Make offer
        </Link>
        <p className="mt-2 text-center text-xs text-ink-faint">
          The shop has 48 hours to confirm or deny.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost w-full" onClick={() => setOpen(true)}>
        Make offer
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-semibold">Make offer</p>
      <p className="mt-1 text-sm text-ink-soft">
        Offer under {money(listedCents)}. The shop has 48 hours to confirm or deny it.
        Confirming drops the listing to your price. After 48 hours the offer closes.
      </p>
      {offer?.status === "pending" && (
        <p className="mt-2 text-sm font-medium">Your offer of {money(offer.amount_cents)} is with the shop.</p>
      )}
      {offer?.status === "accepted" && (
        <p className="mt-2 text-sm font-medium">The shop accepted {money(offer.amount_cents)}.</p>
      )}
      {offer?.status === "declined" && (
        <p className="mt-2 text-sm text-ink-soft">The shop denied {money(offer.amount_cents)}. You can offer again.</p>
      )}
      <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="item_id" value={itemId} />
          <label className="block">
            <span className="sr-only">Offer in dollars</span>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              required
              placeholder="Your price"
              className="field"
            />
          </label>
          <label className="block">
            <span className="sr-only">Note to the shop</span>
            <input name="note" maxLength={280} placeholder="Note to the shop (optional)" className="field" />
          </label>
          {state?.error && <p className="text-sm text-coral">{state.error}</p>}
          {state?.ok && <p className="text-sm font-medium">{state.ok}</p>}
          <button disabled={pending} className="btn btn-ink w-full">
            {pending ? "Sending…" : "Make offer"}
          </button>
        </form>
    </div>
  );
}
