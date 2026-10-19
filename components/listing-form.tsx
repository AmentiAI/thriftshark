"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createListing,
  updateListing,
  deleteListing,
  type FormState,
} from "@/lib/actions";
import { PhotoSetField } from "@/components/image-field";
import { AUCTION_DURATIONS, CONDITIONS, imageSrc, type Category, type Item } from "@/lib/types";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

/** Sellers choose live or draft; "sold" is set from the listings table. */
const SELLER_STATUSES = [
  ["available", "Live — buyers can order it"],
  ["draft", "Draft — only you can see it"],
  ["reserved", "Reserved — on hold"],
  ["sold", "Sold"],
];

/** Shown when the piece is mid-auction, where status is not the seller's to set. */
const AUCTION_NOTE =
  "This piece is in a live auction, so its status is managed by the lot.";

export function ListingForm({ categories, item }: { categories: Category[]; item?: Item }) {
  const editing = Boolean(item);
  const [destination, setDestination] = useState<"rack" | "auction">("rack");
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateListing : createListing,
    null,
  );
  const auctioning = !editing && destination === "auction";

  const dollars = (cents: number | null | undefined) =>
    cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);

  const existing = (item?.images ?? []).flatMap((image) => {
    const src = imageSrc(image);
    return image.id && src ? [{ id: image.id, src }] : [];
  });

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-7">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Photos</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Up to 10. The first one is the cover. Front, back, label, and a
            close-up of any flaw — in daylight on a plain background — sells best.
          </p>

          <div className="mt-5">
            <PhotoSetField
              key={existing.map((e) => e.id).join(",")}
              name="photos"
              existing={existing}
              max={10}
              maxEdge={1800}
            />
          </div>
        </div>

        <div className="panel space-y-5 p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">The piece</h2>

          <div>
            <label className={label} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={item?.title}
              placeholder="Levi's Type III denim trucker"
              className="field"
            />
          </div>

          <div>
            <label className={label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={7}
              defaultValue={item?.description}
              placeholder="Condition notes, flat measurements in inches, and every flaw. Buyers read this and it cuts your returns."
              className="field"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
            <label className={label} htmlFor="price">
              {auctioning ? "Rack price (USD)" : "Price (USD)"}
            </label>
              <input
                id="price"
                name="price"
                required
                inputMode="decimal"
                defaultValue={dollars(item?.price_cents)}
                placeholder="68.00"
                className="field"
              />
              {auctioning && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  What you would take on the rack. The floor can open lower.
                </p>
              )}
            </div>
            <div>
              <label className={label} htmlFor="compare_at">
                Was (optional)
              </label>
              <input
                id="compare_at"
                name="compare_at"
                inputMode="decimal"
                defaultValue={dollars(item?.compare_at_cents)}
                placeholder="95.00"
                className="field"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="brand">
                Brand
              </label>
              <input id="brand" name="brand" defaultValue={item?.brand ?? ""} className="field" />
            </div>
            <div>
              <label className={label} htmlFor="item_size">
                Size
              </label>
              <input
                id="item_size"
                name="item_size"
                defaultValue={item?.item_size ?? ""}
                placeholder="M, 32x32, 9 US"
                className="field"
              />
            </div>
            <div>
              <label className={label} htmlFor="color">
                Colour
              </label>
              <input id="color" name="color" defaultValue={item?.color ?? ""} className="field" />
            </div>
            <div>
              <label className={label} htmlFor="category_id">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={item?.category_id ?? ""}
                className="field"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {auctioning && (
          <div className="panel space-y-5 p-6">
            <h2 className="font-display text-lg font-extrabold tracking-tight">The lot</h2>
            <p className="text-sm text-ink-soft">
              It comes off buy-now the moment you publish. You can pull it only
              before the first bid.
            </p>
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
                  placeholder="20.00"
                  className="field"
                />
              </div>
              <div>
                <label className={label} htmlFor="reserve_price">
                  Reserve (optional)
                </label>
                <input
                  id="reserve_price"
                  name="reserve_price"
                  inputMode="decimal"
                  placeholder="68.00"
                  className="field"
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Hidden. Miss it and the piece goes back on the rack.
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
        )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Publish</h2>

          {!editing && (
            <fieldset className="mt-4">
              <legend className={label}>Where it goes</legend>
              <div className="grid gap-2">
                {(
                  [
                    ["rack", "On the rack", "Buyers pay your price today."],
                    ["auction", "Auction house", "Bidders fight the clock."],
                  ] as const
                ).map(([value, title, body]) => {
                  const active = destination === value;
                  return (
                    <label
                      key={value}
                      className={`tap cursor-pointer rounded-2xl px-4 py-3 ring-2 transition ${
                        active
                          ? "bg-reef/10 ring-reef"
                          : "bg-paper-dim ring-transparent hover:ring-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="destination"
                        value={value}
                        checked={active}
                        onChange={() => setDestination(value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-bold text-ink">{title}</span>
                      <span className="mt-0.5 block text-xs text-ink-faint">{body}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!auctioning && (
            <div className="mt-4">
              <label className={label} htmlFor="status">
                Visibility
              </label>
              {item?.status === "auction" ? (
                <p className="rounded-2xl bg-paper-dim px-4 py-3 text-xs text-ink-soft">
                  {AUCTION_NOTE}
                </p>
              ) : (
                <select
                  id="status"
                  name="status"
                  defaultValue={item?.status ?? "available"}
                  className="field"
                >
                  {SELLER_STATUSES.map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className={label} htmlFor="condition">
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              defaultValue={item?.condition ?? "good"}
              className="field"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {state?.error && (
            <p className="mt-5 rounded-2xl border-l-4 border-coral bg-coral/10 px-3 py-2.5 text-sm">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="mt-5 rounded-2xl border-l-4 border-kelp bg-kelp/10 px-3 py-2.5 text-sm">
              {state.ok}
            </p>
          )}

          <button disabled={pending} className="btn btn-lime sheen mt-5 w-full">
            {pending ? "Saving…" : editing ? "Save changes" : auctioning ? "Open the lot" : "Put it on the rack"}
          </button>

          {item && item.status === "available" && (
            <Link
              href="/dashboard/auctions"
              className="mt-3 block text-center text-sm font-semibold underline hover:text-reef-dark"
            >
              Put this one on the block instead
            </Link>
          )}

          {item && (
            <Link
              href={`/item/${item.slug}`}
              className="mt-3 block text-center text-sm underline hover:text-reef-dark"
            >
              View on the storefront
            </Link>
          )}
        </div>

        {item && (
          <div className="rounded-[1.75rem] border border-coral/30 bg-paper-dim p-6">
            <h2 className="font-display text-lg font-extrabold tracking-tight">Delete</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              Gone for good, photos included. Past orders keep the title and
              price so buyers&apos; receipts stay intact. Mark it sold instead if
              it just left your hands.
            </p>
            <button
              type="submit"
              formAction={deleteListing}
              formNoValidate
              className="btn mt-4 w-full border border-coral text-coral hover:bg-coral hover:text-white"
            >
              Delete listing
            </button>
          </div>
        )}
      </aside>
    </form>
  );
}
