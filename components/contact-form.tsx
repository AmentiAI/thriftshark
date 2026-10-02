"use client";

import { useActionState } from "react";
import { sendMessage, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-faint uppercase";

export function ContactForm({
  itemId,
  itemTitle,
  defaultSubject,
}: {
  itemId?: number;
  itemTitle?: string;
  defaultSubject?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, null);

  if (state?.ok) {
    return (
      <div className="panel bg-reef/30 p-8">
        <h2 className="font-display text-2xl font-bold">Sent.</h2>
        <p className="mt-2 text-ink-soft">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {itemId ? <input type="hidden" name="item_id" value={itemId} /> : null}

      {itemTitle && (
        <p className="rounded-2xl bg-reef px-4 py-3 text-sm font-medium text-white">
          Asking about <strong>{itemTitle}</strong>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          defaultValue={defaultSubject ?? (itemTitle ? `About: ${itemTitle}` : "")}
          className="field"
        />
      </div>

      <div>
        <label className={label} htmlFor="body">Message</label>
        <textarea id="body" name="body" rows={6} required className="field" />
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="btn btn-ink disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
