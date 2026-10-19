"use client";

import { useActionState } from "react";
import { openDm, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function DmStartForm({
  handle,
  itemId,
  itemTitle,
}: {
  handle: string;
  itemId?: number;
  itemTitle?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(openDm, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="handle" value={handle} />
      {itemId ? <input type="hidden" name="item_id" value={itemId} /> : null}

      {itemTitle && (
        <p className="rounded-2xl bg-void px-4 py-3 text-sm font-medium text-ink">
          About <strong>{itemTitle}</strong>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" required maxLength={80} className="field" />
        </div>
        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="body">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          rows={5}
          placeholder="Ask about a measurement, a flaw, or shipping."
          className="field"
        />
      </div>

      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}

      <button disabled={pending} className="btn btn-lime w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
