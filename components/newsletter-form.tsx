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
          className="min-w-0 flex-1 rounded-full border border-paper/20 bg-white/5 px-5 py-3.5 text-base text-paper sm:text-sm placeholder:text-paper/45 focus:border-reef focus:outline-none"
        />
        <button disabled={pending} className="btn btn-lime disabled:opacity-60">
          {pending ? "Adding…" : "Notify me"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm text-reef">{state.ok}</p>}
    </form>
  );
}
