"use client";

import { useActionState } from "react";
import { sendMessage, type FormState } from "@/lib/actions";

const field =
  "w-full border border-line bg-paper px-3.5 py-3 text-sm focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase";

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
      <div className="border border-kelp bg-kelp/10 p-8">
        <h2 className="font-display text-2xl font-bold">Sent.</h2>
        <p className="mt-2 text-ink-soft">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {itemId ? <input type="hidden" name="item_id" value={itemId} /> : null}

      {itemTitle && (
        <p className="border-l-4 border-reef bg-reef/10 px-4 py-3 text-sm">
          Asking about <strong>{itemTitle}</strong>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          defaultValue={defaultSubject ?? (itemTitle ? `About: ${itemTitle}` : "")}
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="body">Message</label>
        <textarea id="body" name="body" rows={6} required className={field} />
      </div>

      {state?.error && (
        <p className="border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="bg-ink px-7 py-4 text-sm font-semibold tracking-wide text-paper uppercase transition hover:bg-reef-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
