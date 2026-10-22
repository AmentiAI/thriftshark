"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { placeBid, type FormState } from "@/lib/actions";
import { money } from "@/lib/format";

/** One button. The amount is the next legal bid, under the signed-in name. */
export function LiveBid({
  auctionId,
  minimum,
  bidderName,
  bidderEmail,
}: {
  auctionId: number;
  minimum: number;
  bidderName: string;
  bidderEmail: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(placeBid, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="auction_id" value={auctionId} />
      <input type="hidden" name="bidder_name" value={bidderName} />
      <input type="hidden" name="bidder_email" value={bidderEmail} />
      <button
        name="amount"
        value={(minimum / 100).toFixed(2)}
        disabled={pending}
        className="btn btn-ink w-full"
      >
        {pending ? "Bidding…" : `Bid ${money(minimum)}`}
      </button>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
    </form>
  );
}
