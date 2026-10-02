"use client";

import { useState } from "react";

/**
 * On a phone the filter form would push every product below the fold, so it
 * collapses behind a toggle. From `lg` up it is just always-visible sidebar
 * content and the toggle disappears.
 */
export function FilterDrawer({
  children,
  activeCount,
  resultCount,
}: {
  children: React.ReactNode;
  activeCount: number;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm font-semibold text-ink-soft">
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="shop-filters"
          className="btn btn-ghost !px-4 !py-2.5 text-xs"
        >
          {open ? "Hide filters" : "Filters"}
          {activeCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-reef px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div
        id="shop-filters"
        className={`${open ? "mt-5 block" : "hidden"} lg:mt-0 lg:block`}
      >
        {children}
      </div>
    </>
  );
}
