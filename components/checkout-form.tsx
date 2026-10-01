"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useBagItems } from "@/components/bag-view";
import { money } from "@/lib/format";
import { placeOrder, type FormState } from "@/lib/actions";
import { FREE_SHIPPING_THRESHOLD_CENTS, shippingFor } from "@/lib/types";

const field =
  "w-full border border-line bg-paper px-3.5 py-3 text-sm focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase";

export function CheckoutForm() {
  const { items, available, unavailable, subtotal, loading } = useBagItems();
  const [fulfilment, setFulfilment] = useState<"ship" | "pickup">("ship");
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, null);

  const shipping = shippingFor(subtotal, fulfilment);
  const total = subtotal + shipping;

  if (loading) {
    return <p className="py-20 text-center text-ink-faint">Loading your bag…</p>;
  }

  if (!items || available.length === 0) {
    return (
      <div className="border border-line bg-paper-dim/60 px-6 py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Nothing to check out</h2>
        <p className="mt-2 text-sm text-ink-soft">Your bag is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-paper uppercase"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <input type="hidden" name="item_ids" value={available.map((i) => i.id).join(",")} />

      <div className="space-y-10">
        {unavailable.length > 0 && (
          <p className="border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">
            {unavailable.length} piece{unavailable.length === 1 ? "" : "s"} sold while
            you were deciding and {unavailable.length === 1 ? "has" : "have"} been left
            out of this order.{" "}
            <Link href="/cart" className="underline">
              Review your bag
            </Link>
            .
          </p>
        )}

        <fieldset>
          <legend className="font-display text-xl font-bold">Who are we shipping to?</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="customer_name">Full name</label>
              <input id="customer_name" name="customer_name" required autoComplete="name" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={field} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" autoComplete="tel" className={field} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl font-bold">How do you want it?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["ship", "Ship it", subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? "Free — 2 day dispatch" : "$8 flat — 2 day dispatch"],
              ["pickup", "Collect in store", "218 Harbour Road, Wed–Sun"],
            ].map(([value, title, note]) => (
              <label
                key={value}
                className={`cursor-pointer border p-4 transition ${
                  fulfilment === value ? "border-ink bg-paper-dim/60" : "border-line hover:border-ink-faint"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fulfilment"
                    value={value}
                    checked={fulfilment === value}
                    onChange={() => setFulfilment(value as "ship" | "pickup")}
                    className="accent-ink"
                  />
                  <span className="font-semibold">{title}</span>
                </span>
                <span className="mt-1 block pl-6 text-xs text-ink-soft">{note}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {fulfilment === "ship" && (
          <fieldset>
            <legend className="font-display text-xl font-bold">Shipping address</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="address_line1">Street address</label>
                <input id="address_line1" name="address_line1" autoComplete="address-line1" className={field} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="address_line2">Apartment, unit (optional)</label>
                <input id="address_line2" name="address_line2" autoComplete="address-line2" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="city">City</label>
                <input id="city" name="city" autoComplete="address-level2" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="region">State / region</label>
                <input id="region" name="region" autoComplete="address-level1" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="postal_code">Postcode</label>
                <input id="postal_code" name="postal_code" autoComplete="postal-code" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="country">Country</label>
                <input id="country" name="country" defaultValue="US" autoComplete="country-name" className={field} />
              </div>
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="font-display text-xl font-bold">Anything we should know?</legend>
          <label className="sr-only" htmlFor="notes">Order notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Gift wrap, delivery instructions, a question about fit…"
            className={`${field} mt-5`}
          />
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-paper-dim/50 p-6">
          <h2 className="font-display text-lg font-bold">
            {available.length} {available.length === 1 ? "piece" : "pieces"}
          </h2>

          <ul className="mt-5 space-y-4">
            {available.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-16 w-12 shrink-0 bg-paper-dim">
                  {item.images[0] && (
                    <Image
                      src={item.images[0].url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-ink-faint">{item.item_size}</p>
                </div>
                <p className="text-sm font-semibold">{money(item.price_cents)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-medium">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                {fulfilment === "pickup" ? "Pickup" : "Shipping"}
              </dt>
              <dd className="font-medium">{shipping === 0 ? "Free" : money(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-base font-bold">
              <dt>Total due</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          {state?.error && (
            <p className="mt-5 border-l-4 border-coral bg-coral/10 px-3 py-2.5 text-sm">
              {state.error}
            </p>
          )}

          <button
            disabled={pending}
            className="mt-6 w-full bg-ink px-6 py-4 text-sm font-semibold tracking-wide text-paper uppercase transition hover:bg-reef-dark disabled:opacity-60"
          >
            {pending ? "Reserving…" : "Place order"}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            No card is charged here. We hold your pieces, email a payment link,
            and ship as soon as it clears.
          </p>
        </div>
      </aside>
    </form>
  );
}
