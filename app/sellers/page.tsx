import Link from "next/link";
import type { Metadata } from "next";
import { SellerCard } from "@/components/seller-card";
import { listSellers, marketplaceStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shops",
  description:
    "Browse every shop on Thrift Sharks. Independent sellers, paid through Stripe.",
};

export default async function SellersPage() {
  const [sellers, stats] = await Promise.all([
    listSellers({ featuredFirst: true, limit: 120 }),
    marketplaceStats(),
  ]);

  return (
    <div className="wrap py-10 sm:py-12">
      <header className="max-w-xl pb-8">
        <p className="eyebrow-pill">{stats.shops} shops</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Independent sellers
        </h1>
        <p className="mt-2 text-ink-soft">
          Their photos. Their prices. Paid through Stripe.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/signup?as=store" className="btn btn-ink">
            Open your shop
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            Shop finds
          </Link>
        </div>
      </header>

      {sellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper-dim px-6 py-16 text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">No shops yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Be the first. Opening a shop takes about a minute.
          </p>
          <Link href="/signup?as=store" className="btn btn-ink mt-6">
            Open the first shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller, i) => (
            <SellerCard key={seller.id} seller={seller} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
