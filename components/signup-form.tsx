"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function SignupForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, null);
  const [role, setRole] = useState<"buyer" | "store">("buyer");
  const [handle, setHandle] = useState("");

  const preview = handle.toLowerCase().replace(/[^a-z0-9-]/g, "") || "your-shop";
  const store = role === "store";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="role" value={role} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid grid-cols-2 gap-2 rounded-full bg-paper-dim p-1">
        <button
          type="button"
          onClick={() => setRole("buyer")}
          className={`tap rounded-full px-3 py-2.5 text-sm font-semibold ${
            !store ? "bg-ink text-paper" : "text-ink-soft"
          }`}
        >
          Buyer
        </button>
        <button
          type="button"
          onClick={() => setRole("store")}
          className={`tap rounded-full px-3 py-2.5 text-sm font-semibold ${
            store ? "bg-ink text-paper" : "text-ink-soft"
          }`}
        >
          Open a store
        </button>
      </div>

      {store ? (
        <>
          <div>
            <label className={label} htmlFor="shop_name">
              Shop name
            </label>
            <input
              id="shop_name"
              name="shop_name"
              required
              placeholder="Night Market"
              className="field"
            />
          </div>

          <div>
            <label className={label} htmlFor="handle">
              Shop link
            </label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm font-semibold text-ink-faint">/shop/</span>
              <input
                id="handle"
                name="handle"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="harbour-road"
                className="field"
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">
              Buyers will find you at <strong className="text-ink">/shop/{preview}</strong>.
            </p>
          </div>
        </>
      ) : (
        <div>
          <label className={label} htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
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
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
          <p className="mt-1.5 text-xs text-ink-faint">At least 8 characters.</p>
        </div>
      </div>

      {store && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="tagline">
              Tagline (optional)
            </label>
            <input
              id="tagline"
              name="tagline"
              placeholder="Workwear and denim, mostly 70s"
              className="field"
            />
          </div>
          <div>
            <label className={label} htmlFor="location">
              Location (optional)
            </label>
            <input id="location" name="location" placeholder="Portland, OR" className="field" />
          </div>
        </div>
      )}

      <p className="rounded-2xl bg-paper-dim px-4 py-3 text-xs leading-relaxed text-ink-soft">
        {store
          ? "Stores are free to open. Stripe checks your photo ID before the shop can sell. Seller Verified is $20 for 30 days. Connect Stripe so buyers can pay you."
          : "A buyer account is free. Buyer Verified is $10 for 30 days: a green check, weekly giveaway entry, and no platform fee. Seller Verified is $20 if you open a store."}
      </p>

      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-ink-faint">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-medium text-ink underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      <button disabled={pending} className="btn btn-ink w-full">
        {pending ? "Creating your account…" : store ? "Open my shop" : "Create my account"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold underline hover:text-ink">
          Sign in
        </Link>
      </p>
    </form>
  );
}
