"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { placeBid, type FormState } from "@/lib/actions";
import { money } from "@/lib/format";

function toCents(raw: string) {
  const value = Number(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}

/**
 * Quick bid at the next legal amount, or a custom amount at or above it. The
 * server re-checks the minimum, so a stale number is refused, not placed.
 */
export function LiveBid({
  auctionId,
  minimum,
  bidderName,
  bidderEmail,
  overlay = false,
}: {
  auctionId: number;
  minimum: number;
  bidderName: string;
  bidderEmail: string;
  /** Coral pill on the video, to the right of the comment line. */
  overlay?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(placeBid, null);
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const cents = toCents(amount);
  const tooLow = cents !== null && cents < minimum;
  const quick = [minimum + 500, minimum + 1000, minimum + 2500];

  if (custom) {
    return (
      <form
        action={(formData) => {
          setCustom(false);
          setAmount("");
          return action(formData);
        }}
        className={
          overlay
            ? "absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-2xl bg-black/85 p-3 text-white"
            : "space-y-3"
        }
      >
        <input type="hidden" name="auction_id" value={auctionId} />
        <input type="hidden" name="bidder_name" value={bidderName} />
        <input type="hidden" name="bidder_email" value={bidderEmail} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Your bid</p>
          <button
            type="button"
            onClick={() => setCustom(false)}
            className="tap px-2 text-sm font-semibold text-white/75"
          >
            Cancel
          </button>
        </div>
        <label className="mt-2 flex h-12 items-center gap-1 rounded-full border border-white/25 bg-white/15 px-4">
          <span className="text-lg font-bold">$</span>
          <input
            name="amount"
            inputMode="decimal"
            autoFocus
            autoComplete="off"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={(minimum / 100).toFixed(2)}
            aria-label="Bid amount in dollars"
            className="h-full min-w-0 flex-1 bg-transparent text-lg font-bold text-white tabular-nums outline-none placeholder:text-white/45"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {quick.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount((value / 100).toFixed(2))}
              className="tap rounded-full bg-white/15 px-3 text-sm font-semibold tabular-nums"
            >
              {money(value)}
            </button>
          ))}
        </div>
        <p className={`mt-2 text-xs ${tooLow ? "text-coral" : "text-white/70"}`}>
          {tooLow ? `The next bid has to be at least ${money(minimum)}.` : `At least ${money(minimum)}.`}
        </p>
        <button
          disabled={pending || cents === null || tooLow}
          className="btn mt-2 w-full bg-coral text-white hover:opacity-90 disabled:opacity-50"
        >
          {cents !== null && !tooLow ? `Bid ${money(cents)}` : "Bid"}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className={overlay ? "flex shrink-0 flex-col items-end gap-1" : "space-y-2"}>
      <input type="hidden" name="auction_id" value={auctionId} />
      <input type="hidden" name="bidder_name" value={bidderName} />
      <input type="hidden" name="bidder_email" value={bidderEmail} />
      {state?.error && <p className="max-w-44 text-right text-xs text-coral">{state.error}</p>}
      <button
        type="button"
        onClick={() => setCustom(true)}
        className={
          overlay
            ? "tap rounded-full bg-black/55 px-3 text-xs font-semibold text-white"
            : "btn btn-ghost w-full"
        }
      >
        Custom bid
      </button>
      <button
        name="amount"
        value={(minimum / 100).toFixed(2)}
        disabled={pending}
        className={overlay ? "btn bg-coral text-white hover:opacity-90" : "btn btn-ink w-full"}
      >
        {pending ? "Bidding…" : `Bid ${money(minimum)}`}
      </button>
    </form>
  );
}
