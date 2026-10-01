"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart";

/** Empties the bag once an order has landed. */
export function ClearBag({ itemIds }: { itemIds: number[] }) {
  const { ids, ready, remove } = useCart();

  useEffect(() => {
    if (!ready) return;
    for (const id of itemIds) {
      if (ids.includes(id)) remove(id);
    }
  }, [ready, ids, itemIds, remove]);

  return null;
}
