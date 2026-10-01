"use client";

import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { CONDITIONS, type Category } from "@/lib/types";

type Props = {
  categories: Category[];
  counts: Record<string, number>;
  sizes: string[];
  brands: string[];
  active: {
    category?: string;
    q?: string;
    condition?: string;
    size?: string;
    brand?: string;
    sort?: string;
    includeSold?: boolean;
  };
  total: number;
};

const SORTS = [
  ["newest", "Newest in"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["title", "A–Z"],
];

const field =
  "w-full border border-line bg-paper px-3 py-2.5 text-sm focus:border-ink focus:outline-none";

export function ShopFilters({ categories, counts, sizes, brands, active, total }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const hasFilters = Boolean(
    active.q || active.category || active.condition || active.size || active.brand || active.includeSold,
  );

  return (
    <Form ref={formRef} action="/shop" className="space-y-7">
      <div>
        <label htmlFor="q" className="eyebrow mb-2 block text-ink-soft">
          Search
        </label>
        <div className="flex">
          <input
            id="q"
            name="q"
            defaultValue={active.q ?? ""}
            placeholder="Levi's, flannel, size 9…"
            className={field}
          />
          <button className="shrink-0 bg-ink px-4 text-sm font-semibold text-paper">
            Go
          </button>
        </div>
      </div>

      <fieldset>
        <legend className="eyebrow mb-2 text-ink-soft">Category</legend>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="category"
              value=""
              defaultChecked={!active.category}
              onChange={submit}
              className="accent-ink"
            />
            <span>Everything</span>
            <span className="ml-auto text-xs text-ink-faint">{total}</span>
          </label>
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="category"
                value={c.slug}
                defaultChecked={active.category === c.slug}
                onChange={submit}
                className="accent-ink"
              />
              <span>{c.name}</span>
              <span className="ml-auto text-xs text-ink-faint">{counts[c.slug] ?? 0}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="size" className="eyebrow mb-2 block text-ink-soft">
            Size
          </label>
          <select
            id="size"
            name="size"
            defaultValue={active.size ?? ""}
            onChange={submit}
            className={field}
          >
            <option value="">Any size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className="eyebrow mb-2 block text-ink-soft">
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue={active.condition ?? ""}
            onChange={submit}
            className={field}
          >
            <option value="">Any condition</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="brand" className="eyebrow mb-2 block text-ink-soft">
          Brand
        </label>
        <select
          id="brand"
          name="brand"
          defaultValue={active.brand ?? ""}
          onChange={submit}
          className={field}
        >
          <option value="">Any brand</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sort" className="eyebrow mb-2 block text-ink-soft">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={active.sort ?? "newest"}
          onChange={submit}
          className={field}
        >
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2 border-t border-line pt-5 text-sm">
        <input
          type="checkbox"
          name="includeSold"
          value="1"
          defaultChecked={active.includeSold}
          onChange={submit}
          className="accent-ink"
        />
        Show the sold archive
      </label>

      {hasFilters && (
        <Link
          href="/shop"
          className="inline-block text-sm text-ink-soft underline hover:text-reef-dark"
        >
          Clear all filters
        </Link>
      )}

      {/* Submit target for browsers without JS. */}
      <noscript>
        <button className="w-full bg-ink px-4 py-3 text-sm font-semibold text-paper uppercase">
          Apply filters
        </button>
      </noscript>
    </Form>
  );
}
