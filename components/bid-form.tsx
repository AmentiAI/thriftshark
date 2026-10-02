"use client";

import { useActionState } from "react";
import { placeBid, type FormState } from "@/lib/actions";
import { money } from "@/lib/format";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function BidForm({
  auctionId,
  minimum,
  increment,
}: {
  auctionId: number;
  minimum: number;
  increment: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(placeBid, null);

  const quick = [minimum, minimum + increment, minimum + increment * 5];

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="auction_id" value={auctionId} />

      <div>
        <label className={label} htmlFor="amount">
          Your bid — {money(minimum)} or more
        </label>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold text-ink-faint">$</span>
          <input
            id="amount"
            name="amount"
            required
            inputMode="decimal"
            defaultValue={(minimum / 100).toFixed(2)}
            className="field font-display text-xl font-extrabold"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {quick.map((amount) => (
            <span
              key={amount}
              className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold text-ink-soft"
            >
              {money(amount)}
            </span>
          ))}
          <span className="px-1 py-1 text-xs text-ink-faint">
            increments of {money(increment)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="bidder_name">
            Your name
          </label>
          <input
            id="bidder_name"
            name="bidder_name"
            required
            autoComplete="name"
            className="field"
          />
        </div>
        <div>
          <label className={label} htmlFor="bidder_email">
            Email
          </label>
          <input
            id="bidder_email"
            name="bidder_email"
            type="email"
            required
            autoComplete="email"
            className="field"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-2xl border-l-4 border-kelp bg-kelp/10 px-4 py-3 text-sm">
          {state.ok}
        </p>
      )}

      <button disabled={pending} className="btn btn-lime sheen w-full">
        {pending ? "Placing bid…" : "Place bid"}
      </button>

      <p className="text-xs leading-relaxed text-ink-faint">
        Bids are binding. Win and you get an order page with the shop&apos;s Cash
        App code — pay that and they ship it. Your email is only shown to the
        shop.
      </p>
    </form>
  );
}
