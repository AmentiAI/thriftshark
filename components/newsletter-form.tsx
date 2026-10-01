"use client";

import { useActionState } from "react";
import { subscribe } from "@/lib/actions";
import type { FormState } from "@/lib/actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);

  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className="min-w-0 flex-1 border border-paper/30 bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-reef focus:outline-none"
        />
        <button
          disabled={pending}
          className="bg-reef px-5 py-3 text-sm font-semibold tracking-wide text-ink uppercase transition hover:bg-paper disabled:opacity-60"
        >
          {pending ? "Adding…" : "Notify me"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm text-reef">{state.ok}</p>}
    </form>
  );
}
