"use client";

import { useActionState, useState } from "react";
import { leaveSellerReview, type FormState } from "@/lib/actions";

export function ReviewForm({ orderId, token }: { orderId: number; token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(leaveSellerReview, null);
  const [rating, setRating] = useState(5);

  if (state?.ok) {
    return (
      <p className="rounded-2xl bg-kelp/10 px-4 py-3 text-sm font-semibold text-ink">
        Thanks — your review is on the shop.
      </p>
    );
  }

  return (
    <form action={action} className="max-w-md space-y-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating" value={rating} />

      <fieldset>
        <legend className="text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">
          Rate this shop
        </legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`tap grid h-11 w-11 place-items-center rounded-full text-xl ${
                n <= rating ? "text-gold" : "text-ink-faint"
              }`}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-faint">{rating} of 5</p>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">
          Comment (optional)
        </span>
        <textarea
          name="body"
          rows={3}
          maxLength={500}
          placeholder="How did the piece and the shipping go?"
          className="field"
        />
      </label>

      {state?.error && (
        <p className="rounded-2xl bg-coral/10 px-3 py-2 text-sm">{state.error}</p>
      )}

      <button disabled={pending} className="btn btn-ink">
        {pending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
