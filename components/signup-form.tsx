"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpSeller, type FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpSeller, null);
  const [handle, setHandle] = useState("");

  const preview = handle.toLowerCase().replace(/[^a-z0-9-]/g, "") || "your-shop";

  return (
    <form action={action} className="space-y-6">
      <div>
        <label className={label} htmlFor="shop_name">
          Shop name
        </label>
        <input
          id="shop_name"
          name="shop_name"
          required
          placeholder="Harbour Road Vintage"
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
          Buyers will find you at <strong className="text-ink">/shop/{preview}</strong>. Lowercase
          letters, numbers and dashes.
        </p>
      </div>

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

      <div>
        <label className={label} htmlFor="cashapp_tag">
          Your $cashtag
        </label>
        <input
          id="cashapp_tag"
          name="cashapp_tag"
          required
          placeholder="$yourname"
          className="field"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          We turn this into a scannable Cash App code on your storefront and on
          every order, so buyers pay you directly. You can change it any time.
        </p>
      </div>

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

      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="btn btn-lime w-full">
        {pending ? "Opening your shop…" : "Open my shop"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Already selling?{" "}
        <Link href="/login" className="font-semibold underline hover:text-reef-dark">
          Sign in
        </Link>
      </p>
    </form>
  );
}
