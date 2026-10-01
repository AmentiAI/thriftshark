"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";

export function AddToBag({ id, soldOut }: { id: number; soldOut: boolean }) {
  const { has, add, ready } = useCart();

  if (soldOut) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full cursor-not-allowed border border-line bg-paper-dim px-6 py-4 text-sm font-semibold tracking-wide text-ink-faint uppercase"
        >
          Sold — gone for good
        </button>
        <p className="text-sm text-ink-soft">
          Every piece here is one of one.{" "}
          <Link href="/shop" className="underline hover:text-reef-dark">
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
        <Link
          href="/cart"
          className="block w-full border border-ink bg-paper px-6 py-4 text-center text-sm font-semibold tracking-wide text-ink uppercase transition hover:bg-ink hover:text-paper"
        >
          In your bag — review it
        </Link>
      ) : (
        <button
          onClick={() => add(id)}
          className="w-full bg-ink px-6 py-4 text-sm font-semibold tracking-wide text-paper uppercase transition hover:bg-reef-dark"
        >
          Add to bag
        </button>
      )}
      <p className="text-sm text-ink-soft">
        One of a kind. Adding it to your bag does not hold it — checkout does.
      </p>
    </div>
  );
}
