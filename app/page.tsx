import Link from "next/link";
import Image from "next/image";
import { ItemCard } from "@/components/item-card";
import { SellerCard } from "@/components/seller-card";
import { AuctionCard } from "@/components/auction-card";
import { liveAuctions } from "@/lib/auctions";
import { categoryImage } from "@/lib/category-images";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedItems,
  getLatestItems,
  getStockedSellers,
  marketplaceStats,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, categories, counts, gridSellers, stats, auctions] =
    await Promise.all([
      getFeaturedItems(8),
      getLatestItems(12),
      getCategories(),
      getCategoryCounts(),
      getStockedSellers(6),
      marketplaceStats(),
      liveAuctions(4),
    ]);

  const trending = featured.length > 0 ? featured : latest.slice(0, 8);
  const fresh = latest.slice(0, 12);

  return (
    <>
      {/* Hero — brand crest is the visual anchor */}
      <section className="border-b border-line bg-void text-white">
        <div className="wrap grid items-center gap-8 py-12 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:py-16">
          <div className="min-w-0 lg:max-w-lg">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
              Thrift Sharks · {stats.shops} shops
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]">
              Buy one-of-one.
              <span className="mt-1 block text-foam">Sell for free.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              Independent shops. Honest condition. Paid securely through Stripe.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="btn bg-white text-ink hover:bg-paper-dim">
                Shop now
              </Link>
              <Link href="/signup" className="btn btn-ghost-light">
                Open a shop
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[32rem]">
              <Image
                src="/crest.png"
                alt="Thrift Sharks"
                fill
                priority
                sizes="(min-width: 1024px) 32rem, 90vw"
                className="object-contain object-center drop-shadow-[0_20px_50px_rgb(0_0_0/0.45)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fresh drops — merch first */}
      <section className="wrap py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Fresh drops
          </h2>
          <Link href="/shop?sort=newest" className="text-sm font-semibold text-ink-faint hover:text-ink">
            See all
          </Link>
        </div>

        {fresh.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper-dim px-6 py-16 text-center">
            <p className="font-display text-xl font-bold tracking-tight">Nothing listed yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              Be the first shop on the rack — listing takes about a minute.
            </p>
            <Link href="/signup" className="btn btn-ink mt-6">
              Open a shop
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
            {fresh.map((item, i) => (
              <ItemCard key={item.id} item={item} priority={i < 4} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="border-y border-line bg-paper-dim/60">
        <div className="wrap py-8 sm:py-10">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Shop by category
          </h2>
          <div className="mt-5 scroll-x flex gap-2.5 pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7">
            {categories.map((c) => {
              const n = counts[c.slug] ?? 0;
              const src = categoryImage(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  className="group relative min-w-[8.5rem] overflow-hidden rounded-xl bg-paper-dim sm:min-w-0"
                >
                  <div className="relative aspect-[4/5]">
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 12vw, 40vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-paper-dim" />
                    )}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="mt-0.5 text-xs text-white/70">
                        {n > 0 ? `${n} live` : "Browse"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="wrap py-10 sm:py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Worth a look
            </h2>
            <Link href="/shop" className="text-sm font-semibold text-ink-faint hover:text-ink">
              Shop all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
            {trending.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {auctions.length > 0 && (
        <section className="border-t border-line">
          <div className="wrap py-10 sm:py-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Live auctions
              </h2>
              <Link href="/auctions" className="text-sm font-semibold text-ink-faint hover:text-ink">
                All lots
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </section>
      )}

      {gridSellers.length > 0 && (
        <section className="border-t border-line bg-paper-dim/40">
          <div className="wrap py-10 sm:py-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Shops
              </h2>
              <Link href="/sellers" className="text-sm font-semibold text-ink-faint hover:text-ink">
                All {stats.shops} shops
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridSellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line">
        <div className="wrap flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center sm:py-14">
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Selling is free
            </h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">
              Your storefront, your payouts. List in under a minute.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-ink">
              Start your shop
            </Link>
            <Link href="/sell" className="btn btn-ghost">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
