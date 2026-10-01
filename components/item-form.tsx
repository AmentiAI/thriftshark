"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createItem, updateItem, deleteItem, type FormState } from "@/lib/actions";
import { CONDITIONS, STATUSES, type Category, type Item } from "@/lib/types";

const field =
  "w-full border border-line bg-paper px-3.5 py-2.5 text-sm focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase";

export function ItemForm({
  categories,
  item,
}: {
  categories: Category[];
  item?: Item;
}) {
  const editing = Boolean(item);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateItem : createItem,
    null,
  );

  const dollars = (cents: number | null | undefined) =>
    cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form action={action} className="space-y-7" id="item-form">
        {item && <input type="hidden" name="id" value={item.id} />}

        <div>
          <label className={label} htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            required
            defaultValue={item?.title}
            placeholder="Levi's Type III Denim Trucker"
            className={field}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            The URL slug is generated from this, and kept unique automatically.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={7}
            defaultValue={item?.description}
            placeholder="Condition notes, flat measurements, every flaw. Buyers read this."
            className={field}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="price">Price (USD)</label>
            <input
              id="price"
              name="price"
              required
              inputMode="decimal"
              defaultValue={dollars(item?.price_cents)}
              placeholder="68.00"
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="compare_at">Was (optional)</label>
            <input
              id="compare_at"
              name="compare_at"
              inputMode="decimal"
              defaultValue={dollars(item?.compare_at_cents)}
              placeholder="95.00"
              className={field}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Higher than the price shows a markdown badge.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="brand">Brand</label>
            <input id="brand" name="brand" defaultValue={item?.brand ?? ""} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="item_size">Size</label>
            <input
              id="item_size"
              name="item_size"
              defaultValue={item?.item_size ?? ""}
              placeholder="M, 32x32, 9 US"
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="color">Colour</label>
            <input id="color" name="color" defaultValue={item?.color ?? ""} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={item?.category_id ?? ""}
              className={field}
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

        <div>
          <label className={label} htmlFor="image_urls">Photo URLs</label>
          <textarea
            id="image_urls"
            name="image_urls"
            rows={4}
            defaultValue={item?.images.map((i) => i.url).join("\n")}
            placeholder={"https://…/front.jpg\nhttps://…/back.jpg\nhttps://…/flaw.jpg"}
            className={`${field} font-mono text-xs`}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            One per line, first is the cover. {editing && "Leave blank to keep the current photos. "}
            Hosts must be allowed in <code>next.config.ts</code>.
          </p>
        </div>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-paper-dim/40 p-5">
          <h2 className="font-display font-bold">Publishing</h2>

          <div className="mt-4">
            <label className={label} htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              form="item-form"
              defaultValue={item?.status ?? "available"}
              className={field}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "available" ? "Available (live)" : s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className={label} htmlFor="condition">Condition</label>
            <select
              id="condition"
              name="condition"
              form="item-form"
              defaultValue={item?.condition ?? "good"}
              className={field}
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              form="item-form"
              defaultChecked={item?.featured}
              className="accent-ink"
            />
            Staff pick (shows on the homepage)
          </label>

          {state?.error && (
            <p className="mt-5 border-l-4 border-coral bg-coral/10 px-3 py-2.5 text-sm">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="mt-5 border-l-4 border-kelp bg-kelp/10 px-3 py-2.5 text-sm">
              {state.ok}
            </p>
          )}

          <button
            form="item-form"
            disabled={pending}
            className="mt-5 w-full bg-ink px-5 py-3.5 text-sm font-semibold tracking-wide text-paper uppercase disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Publish item"}
          </button>

          {item && (
            <Link
              href={`/item/${item.slug}`}
              className="mt-3 block text-center text-sm underline hover:text-reef-dark"
            >
              View on storefront
            </Link>
          )}
        </div>

        {item && (
          <form action={deleteItem} className="border border-coral/40 p-5">
            <input type="hidden" name="id" value={item.id} />
            <h2 className="font-display font-bold">Delete</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              Removes the item and its photos for good. Order history keeps the
              title and price, so past receipts stay intact. Mark it
              &ldquo;sold&rdquo; instead if it simply left the shop.
            </p>
            <button className="mt-4 w-full border border-coral px-5 py-2.5 text-sm font-semibold tracking-wide text-coral uppercase hover:bg-coral hover:text-white">
              Delete item
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
