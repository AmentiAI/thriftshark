import Link from "next/link";
import type { Metadata } from "next";
import { SellerCard } from "@/components/seller-card";
import { listSellers, marketplaceStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Every shop",
  description:
    "Browse every shop on Thrift Shark. Independent sellers, their own storefronts, paid straight to Cash App.",
};

export default async function SellersPage() {
  const [sellers, stats] = await Promise.all([
    listSellers({ featuredFirst: true, limit: 120 }),
    marketplaceStats(),
  ]);

  return (
    <div className="wrap py-12">
      <header className="rounded-[2rem] bg-ink p-8 text-paper sm:p-12">
        <p className="eyebrow-pill">The shops</p>
        <h1 className="mt-5 font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.05em] sm:text-6xl">
          {stats.shops} independent
          <span className="block text-reef">sellers.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/70">
          Every shop here is someone&apos;s own. They set their prices, shoot
          their own photos and get paid straight to their Cash App — Thrift
          Shark just brings the buyers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sell" className="btn btn-lime">
            Open your shop
          </Link>
          <Link href="/shop" className="btn btn-ghost-light">
            Shop all {stats.listings} listings
          </Link>
        </div>
      </header>

      {sellers.length === 0 ? (
        <div className="panel mt-10 px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            No shops open yet
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-soft">
            Be the first. Opening a shop takes about a minute and costs nothing.
          </p>
          <Link href="/sell" className="btn btn-ink mt-7">
            Open the first shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      )}
    </div>
  );
}
