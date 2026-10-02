"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createListing,
  updateListing,
  deleteListing,
  type FormState,
} from "@/lib/actions";
import { CONDITIONS, imageSrc, type Category, type Item } from "@/lib/types";

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
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateListing : createListing,
    null,
  );
  const [photoCount, setPhotoCount] = useState(0);

  const dollars = (cents: number | null | undefined) =>
    cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);

  const existing = (item?.images ?? []).map(imageSrc).filter(Boolean) as string[];

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-7">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Photos</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Up to 6, under 3MB each. The first one is the cover. Daylight, plain
            background, and a close-up of any flaw sells best.
          </p>

          {existing.length > 0 && (
            <div className="mt-5">
              <p className={label}>Currently live</p>
              <div className="flex flex-wrap gap-2">
                {existing.map((src) => (
                  <div
                    key={src}
                    className="relative h-20 w-16 overflow-hidden rounded-xl bg-paper-dim ring-1 ring-black/5"
                  >
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Uploading new photos replaces this set. Leave it empty to keep them.
              </p>
            </div>
          )}

          <div className="mt-5">
            <label className={label} htmlFor="photos">
              {existing.length > 0 ? "Replace photos" : "Upload photos"}
            </label>
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
              className="w-full rounded-2xl border border-line border-dashed bg-white px-4 py-6 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-wide file:text-paper file:uppercase"
            />
            {photoCount > 0 && (
              <p className="mt-2 text-xs font-semibold text-kelp">
                {photoCount} photo{photoCount === 1 ? "" : "s"} ready to upload
                {photoCount > 6 && " — only the first 6 are kept"}
              </p>
            )}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
              Or paste image links instead
            </summary>
            <textarea
              name="image_urls"
              rows={3}
              placeholder={"https://…/front.jpg\nhttps://…/back.jpg"}
              className="field mt-3 font-mono sm:text-xs"
            />
          </details>
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
                Price (USD)
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
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Publish</h2>

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

          <button disabled={pending} className="btn btn-lime mt-5 w-full">
            {pending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Put it on the rack"}
          </button>

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
          <div className="rounded-[1.75rem] border border-coral/30 bg-white p-6">
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
