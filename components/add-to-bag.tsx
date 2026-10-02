"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";

export function AddToBag({ id, soldOut }: { id: number; soldOut: boolean }) {
  const { has, add, ready } = useCart();

  if (soldOut) {
    return (
      <div className="space-y-3">
        <button disabled className="btn w-full cursor-not-allowed bg-paper-dim text-ink-faint">
          Sold — gone for good
        </button>
        <p className="text-sm text-ink-soft">
          Every piece here is one of one.{" "}
          <Link href="/shop" className="font-semibold underline">
            See what is still swimming
          </Link>
          .
        </p>
      </div>
    );
  }

  const inBag = ready && has(id);

  return (
    <div className="space-y-3">
      {inBag ? (
        <Link href="/cart" className="btn btn-ghost w-full">
          In your bag — review it
        </Link>
      ) : (
        <button onClick={() => add(id)} className="btn btn-ink w-full">
          Add to bag
        </button>
      )}
      <p className="text-sm text-ink-soft">
        One of a kind. Adding it to your bag does not hold it — checkout does.
      </p>
    </div>
  );
}
