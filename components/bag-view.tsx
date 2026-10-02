"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { money } from "@/lib/format";
import {
  conditionLabel,
  FREE_SHIPPING_THRESHOLD_CENTS,
  imageSrc,
  shippingFor,
  type Item,
} from "@/lib/types";

const EMPTY_ITEMS: Item[] = [];

/** Shared by /cart and /checkout: resolves stored ids into live items. */
export function useBagItems() {
  const { ids, ready, remove } = useCart();
  const [fetched, setFetched] = useState<{ key: string; items: Item[] } | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    if (!ready || ids.length === 0) return;

    let cancelled = false;
    fetch(`/api/bag?ids=${key}`)
      .then((r) => r.json())
      .then((data: { items: Item[] }) => {
        if (!cancelled) setFetched({ key, items: data.items });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [key, ready, ids.length]);

  // Filtering the last response keeps removals instant instead of flashing a
  // loading state while the next fetch lands.
  const items =
    ids.length === 0
      ? EMPTY_ITEMS
      : fetched
        ? fetched.items.filter((i) => ids.includes(i.id))
        : null;

  const available = (items ?? EMPTY_ITEMS).filter((i) => i.status === 'available');
  const unavailable = (items ?? EMPTY_ITEMS).filter((i) => i.status !== 'available');
  const subtotal = available.reduce((sum, i) => sum + i.price_cents, 0);

  return { items, available, unavailable, subtotal, remove, loading: !ready || items === null };
}

export function BagView() {
  const { items, available, unavailable, subtotal, remove, loading } = useBagItems();
  const shipping = shippingFor(subtotal, "ship");
  const toFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;

  if (loading) {
    return <p className="py-20 text-center text-ink-faint">Opening your bag…</p>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="panel px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">Your bag is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Nothing in here yet. The rack restocks every Thursday and the good
          pieces rarely last the weekend.
        </p>
        <Link
          href="/shop"
          className="btn btn-ink mt-6"
        >
          Start digging
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <ul className="panel divide-y divide-line px-5">
        {items.map((item) => {
          const sold = item.status !== "available";
          return (
            <li key={item.id} className="flex gap-4 py-5">
              <Link href={`/item/${item.slug}`} className="relative h-28 w-21 shrink-0 overflow-hidden rounded-2xl bg-paper-dim">
                {imageSrc(item.images[0]) && (
                  <Image
                    src={imageSrc(item.images[0])!}
                    alt={item.images[0].alt ?? item.title}
                    fill
                    sizes="96px"
                    className={`object-contain bg-white p-1 ${sold ? "opacity-50 grayscale" : ""}`}
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/item/${item.slug}`} className="font-display font-bold tracking-tight hover:underline">
                    {item.title}
                  </Link>
                  <p className="shrink-0 font-semibold">{money(item.price_cents)}</p>
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {[item.brand, item.item_size && `Size ${item.item_size}`, conditionLabel(item.condition)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {sold && (
                  <p className="mt-2 text-xs font-semibold text-coral uppercase">
                    Sold while it sat in your bag
                  </p>
                )}
                <button
                  onClick={() => remove(item.id)}
                  className="mt-auto self-start pt-3 text-xs text-ink-faint underline hover:text-coral"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-44 lg:self-start">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-bold">Summary</h2>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                Subtotal ({available.length} {available.length === 1 ? "piece" : "pieces"})
              </dt>
              <dd className="font-medium">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="font-medium">{shipping === 0 ? "Free" : money(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-base font-bold">
              <dt>Total</dt>
              <dd>{money(subtotal + shipping)}</dd>
            </div>
          </dl>

          {toFreeShipping > 0 && available.length > 0 && (
            <p className="mt-4 rounded-2xl bg-reef px-3 py-2.5 text-xs font-medium text-white">
              {money(toFreeShipping)} more and shipping is on us.
            </p>
          )}

          {unavailable.length > 0 && (
            <p className="mt-4 rounded-2xl bg-coral/10 px-3 py-2.5 text-xs text-ink-soft">
              Remove the sold {unavailable.length === 1 ? "piece" : "pieces"} above
              to check out.
            </p>
          )}

          <Link
            href={available.length > 0 && unavailable.length === 0 ? "/checkout" : "/cart"}
            aria-disabled={available.length === 0 || unavailable.length > 0}
            className={`btn mt-6 w-full ${
              available.length > 0 && unavailable.length === 0
                ? "btn-ink"
                : "pointer-events-none bg-paper-dim text-ink-faint"
            }`}
          >
            Checkout
          </Link>

          <Link
            href="/shop"
            className="mt-3 block text-center text-sm font-semibold underline"
          >
            Keep looking
          </Link>
        </div>
      </aside>
    </div>
  );
}
