"use client";

import { useActionState } from "react";
import { claimAuctionWin, type FormState } from "@/lib/actions";

export function ClaimWinForm({ auctionId }: { auctionId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(claimAuctionWin, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="auction_id" value={auctionId} />
      <label
        className="block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase"
        htmlFor="claim-email"
      >
        Won this lot? Enter the email you bid with
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="claim-email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className="field"
        />
        <button disabled={pending} className="btn btn-ink shrink-0">
          {pending ? "Checking…" : "Open my order"}
        </button>
      </div>
      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
