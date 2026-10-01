"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/lib/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full border border-line bg-paper px-3.5 py-3 text-sm focus:border-ink focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="w-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-paper uppercase disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
