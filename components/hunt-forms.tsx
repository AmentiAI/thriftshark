"use client";

import Link from "next/link";
import { useActionState } from "react";
import { closeHunt, postHunt, replyToHunt, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-faint uppercase";

export function PostHuntForm({ signedIn }: { signedIn: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(postHunt, null);
  if (!signedIn) {
    return (
      <div className="rounded-xl border border-line p-5">
        <p className="text-sm text-ink-soft">Sign in to tell shops what you&apos;re hunting.</p>
        <Link href="/login?next=/hunts" className="btn btn-ink mt-4">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line p-5">
      <div>
        <label className={label} htmlFor="hunt-title">
          What do you want?
        </label>
        <input id="hunt-title" name="title" required maxLength={80} className="field" placeholder="Chrome Hearts trucker, camo" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hunt-size">
            Size
          </label>
          <input id="hunt-size" name="size_label" maxLength={40} className="field" placeholder="L, 10.5, 32x32" />
        </div>
        <div>
          <label className={label} htmlFor="hunt-budget">
            Budget, USD
          </label>
          <input id="hunt-budget" name="budget" type="number" min={0} step="1" inputMode="decimal" className="field" placeholder="150" />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="hunt-details">
          Details
        </label>
        <textarea id="hunt-details" name="details" rows={3} maxLength={600} className="field" placeholder="Condition you'll take, color, era." />
      </div>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium">{state.ok}</p>}
      <button disabled={pending} className="btn btn-ink">
        {pending ? "Posting…" : "Post hunt"}
      </button>
    </form>
  );
}

export function CloseHuntButton({ huntId }: { huntId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(closeHunt, null);
  return (
    <form action={action}>
      <input type="hidden" name="hunt_id" value={huntId} />
      <button disabled={pending} className="text-sm font-semibold text-ink-faint hover:text-ink">
        {pending ? "Closing…" : "Close hunt"}
      </button>
      {state?.error && <p className="mt-1 text-sm text-coral">{state.error}</p>}
    </form>
  );
}

export function HuntReplyForm({
  huntId,
  listings,
}: {
  huntId: number;
  listings: { id: number; title: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(replyToHunt, null);
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="hunt_id" value={huntId} />
      {listings.length > 0 && (
        <select name="item_id" className="field" defaultValue="">
          <option value="">Reply with a listing (optional)</option>
          {listings.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      )}
      <input name="note" maxLength={400} className="field" placeholder="Or say what you have" />
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium">{state.ok}</p>}
      <button disabled={pending} className="btn btn-ghost">
        {pending ? "Sending…" : "Reply"}
      </button>
    </form>
  );
}
