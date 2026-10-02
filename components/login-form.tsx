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
          className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-faint uppercase"
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
          className="field"
        />
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="btn btn-ink w-full disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
