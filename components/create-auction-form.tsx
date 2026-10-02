"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { createAuction, type FormState } from "@/lib/actions";
import { money } from "@/lib/format";
import { AUCTION_DURATIONS, imageSrc, type Item } from "@/lib/types";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function CreateAuctionForm({ items }: { items: Item[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createAuction, null);
  const [selected, setSelected] = useState<number | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return (
      <div className="panel px-6 py-12 text-center">
        <h3 className="font-display text-xl font-extrabold tracking-tight">
          Nothing available to auction
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Only live listings that are not already on the block can be auctioned.
          Add a listing first, then put it up.
        </p>
      </div>
    );
  }

  const item = items.find((i) => i.id === selected) ?? items[0];

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="panel space-y-6 p-6">
        <div>
          <p className={label}>Pick the piece</p>
          <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {items.map((option) => {
              const src = imageSrc(option.images[0]);
              const active = option.id === item.id;
              return (
                <li key={option.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-2.5 ring-1 transition ${
                      active ? "bg-paper-dim ring-ink" : "bg-white ring-black/5 hover:ring-ink-faint"
                    }`}
                  >
                    <input
                      type="radio"
                      name="item_id"
                      value={option.id}
                      checked={active}
                      onChange={() => setSelected(option.id)}
                      className="sr-only"
                    />
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
                      {src && <Image src={src} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{option.title}</span>
                      <span className="block text-xs text-ink-faint">
                        listed at {money(option.price_cents)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="start_price">
              Opening bid
            </label>
            <input
              id="start_price"
              name="start_price"
              required
              inputMode="decimal"
              defaultValue={(Math.max(100, Math.round(item.price_cents * 0.4)) / 100).toFixed(2)}
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Low openings pull more bidders in. A reserve protects you.
            </p>
          </div>
          <div>
            <label className={label} htmlFor="reserve_price">
              Reserve (optional)
            </label>
            <input
              id="reserve_price"
              name="reserve_price"
              inputMode="decimal"
              placeholder={(item.price_cents / 100).toFixed(2)}
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Hidden from bidders. Below it, nobody wins and the piece goes back
              on the rack.
            </p>
          </div>
          <div>
            <label className={label} htmlFor="increment">
              Bid increment
            </label>
            <input
              id="increment"
              name="increment"
              required
              inputMode="decimal"
              defaultValue="1.00"
              className="field"
            />
          </div>
          <div>
            <label className={label} htmlFor="hours">
              Runs for
            </label>
            <select id="hours" name="hours" defaultValue="72" className="field">
              {AUCTION_DURATIONS.map((d) => (
                <option key={d.hours} value={d.hours}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <aside className="panel h-fit p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-extrabold tracking-tight">On the block</h2>
        <p className="mt-2 text-sm text-ink-soft">
          <strong className="text-ink">{item.title}</strong> comes off buy-now
          while it runs. You cannot cancel once somebody bids.
        </p>

        {state?.error && (
          <p className="mt-5 rounded-2xl border-l-4 border-coral bg-coral/10 px-3 py-2.5 text-sm">
            {state.error}
          </p>
        )}

        <button disabled={pending} className="btn btn-lime sheen mt-5 w-full">
          {pending ? "Starting…" : "Start the auction"}
        </button>
      </aside>
    </form>
  );
}
