"use client";

import { useCart } from "@/components/cart";

export function BagCount() {
  const { ids, ready } = useCart();
  if (!ready || ids.length === 0) return null;
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink">
      {ids.length}
    </span>
  );
}
