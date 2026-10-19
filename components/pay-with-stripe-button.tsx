"use client";

import { useActionState } from "react";
import { payOrderWithStripe, type FormState } from "@/lib/actions";

export function PayWithStripeButton({
  orderId,
  token,
  amountLabel,
}: {
  orderId: number;
  token: string;
  amountLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    payOrderWithStripe,
    null,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="token" value={token} />
      <button type="submit" className="btn btn-ink w-full sm:w-auto" disabled={pending}>
        {pending ? "Opening checkout…" : `Pay ${amountLabel} securely`}
      </button>
      {state?.error && (
        <p className="text-sm text-coral" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
