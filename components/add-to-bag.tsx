"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";

export function AddToBag({ id, soldOut }: { id: number; soldOut: boolean }) {
  const { has, add, ready } = useCart();

  if (soldOut) {
    return (
      <div className="space-y-3">
        <button disabled className="btn w-full cursor-not-allowed bg-paper-dim text-ink-faint">
          Sold
        </button>
        <p className="text-sm text-ink-faint">
          One of one — it&apos;s gone.{" "}
          <Link href="/shop" className="font-semibold text-ink underline-offset-2 hover:underline">
            Keep shopping
          </Link>
        </p>
      </div>
    );
  }

  const inBag = ready && has(id);

  return (
    <div className="space-y-3">
      {inBag ? (
        <Link href="/cart" className="btn btn-ghost w-full">
          In your bag — checkout
        </Link>
      ) : (
        <button onClick={() => add(id)} className="btn btn-ink w-full">
          Add to bag
        </button>
      )}
      <p className="text-sm text-ink-faint">
        One of a kind. Your bag doesn&apos;t hold it — checkout does.
      </p>
    </div>
  );
}
