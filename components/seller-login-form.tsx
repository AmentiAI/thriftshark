"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInSeller, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function SellerLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signInSeller, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          className="field"
        />
      </div>

      <div>
        <label className={label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>

      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="btn btn-ink w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        No shop yet?{" "}
        <Link href="/signup" className="font-semibold underline hover:text-reef-dark">
          Open one free
        </Link>
      </p>
    </form>
  );
}
