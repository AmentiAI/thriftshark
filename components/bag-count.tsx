"use client";

import { useCart } from "@/components/cart";

export function BagCount({ className = "ml-1.5" }: { className?: string }) {
  const { ids, ready } = useCart();
  if (!ready || ids.length === 0) return null;
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink ${className}`}
    >
      {ids.length}
    </span>
  );
}
