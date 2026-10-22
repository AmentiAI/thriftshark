import Link from "next/link";
import Image from "next/image";
import { DropClock } from "@/components/drop-clock";
import { ShopAvatar } from "@/components/shop-avatar";
import { ItemCard } from "@/components/item-card";
import { AuctionCard } from "@/components/auction-card";
import { ShopsCarousel } from "@/components/shops-carousel";
import { TopShopsWidget } from "@/components/top-shops-widget";
import { liveAuctions } from "@/lib/auctions";
import { categoryImage } from "@/lib/category-images";
import { listLiveShows } from "@/lib/live-shows";
import { money } from "@/lib/format";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedItems,
  getLatestItems,
  getWeeklyTopShops,
  listSellers,
  marketplaceStats,
  upcomingDrops,
} from "@/lib/queries";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    featured,
    latest,
    categories,
    counts,
    shops,
    weeklyTop,
    stats,
    auctions,
    drops,
    liveShows,
  ] = await Promise.all([
    getFeaturedItems(8),
    getLatestItems(12),
    getCategories(),
    getCategoryCounts(),
    listSellers({ featuredFirst: true, limit: 24 }),
    getWeeklyTopShops(5),
    marketplaceStats(),
    liveAuctions(4),
    upcomingDrops(4),
    listLiveShows(),
  ]);

  const trending = featured.length > 0 ? featured : latest.slice(0, 8);
  const fresh = latest.slice(0, 12);

  return (
    <>
      {/* Hero — centered middle bar, not full-bleed */}
      <section className="border-b border-line bg-paper">
        <h1 className="sr-only">
          Thrift Sharks — buy and sell one-of-one secondhand
        </h1>
        <div className="py-3 sm:wrap sm:py-6">
          <Image
            src="/hero-banner.jpg"
            alt="Thrift Sharks — streetwear, sneakers, and luxury finds"
            width={1024}
            height={244}
            priority
            sizes="100vw"
            className="mx-auto h-auto w-full sm:max-w-6xl sm:rounded-xl"
          />
          <div className="wrap mt-3 flex flex-col gap-3 sm:mx-auto sm:max-w-6xl sm:flex-row sm:items-center sm:justify-between sm:px-0">
            <p className="text-xs text-ink-soft sm:text-sm">
              One-of-one shops. You pay the seller through Stripe. Make an offer,
              or post a hunt if it isn&apos;t listed yet.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/shop" className="btn btn-ink !px-4 !py-2 text-sm">
                Shop now
              </Link>
              <Link href="/signup" className="btn btn-ghost !px-4 !py-2 text-sm">
                Open a shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {liveShows.length > 0 && (
        <section className="border-b border-line py-8">
          <div className="wrap mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-coral uppercase">Live now</p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-tight sm:text-xl">
                On camera
              </h2>
            </div>
            <Link href="/live" className="text-sm font-semibold underline">
              All live shows
            </Link>
          </div>
          <ul className="wrap grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveShows.map((show) => {
              const lot = show.lots.find((item) => item.auction_id === show.current_auction_id);
              return (
                <li key={show.id}>
                  <Link href={`/live/${show.id}`} className="panel block p-5 hover:border-ink">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-coral uppercase">
                      <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
                      Live
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight">{show.title}</h3>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm">
                      <ShopAvatar
                        shopName={show.seller_shop_name}
                        logoImageId={show.seller_logo_image_id}
                        size={28}
                      />
                      <span className="min-w-0 break-anywhere">{show.seller_shop_name}</span>
                    </p>
                    <p className="mt-3 text-sm text-ink-soft">
                      {lot
                        ? `On stage: ${lot.title} · ${money(lot.high_cents ?? lot.start_cents)}`
                        : "On camera. The next piece starts when they set a price."}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="border-b border-line">
        <div className="wrap grid gap-6 py-6 sm:grid-cols-3 sm:py-8">
          {[
            ["Pay the shop", "The item price goes to that seller. We take a fee. We never hold the piece."],
            ["Make an offer", "Offer under the listed price. The shop has 48 hours to confirm or deny. Confirming sets that price."],
            ["Post a hunt", "Name the piece. When a shop lists something close, the hunt gets a reply pointing at it."],
            ["ID checked", "New shops pass a document and selfie check before they can sell. The badge is public. The document is not."],
            ["Your size", "Save chest, waist, inseam, and shoe size once. Measured listings say if they are close, small, or big."],
            ["Drop clock", "A shop can hide a piece until a time, then it goes live for everyone. The countdown sits on the shop."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-display text-base font-bold tracking-tight">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {drops.length > 0 && (
        <section className="border-b border-line py-8">
          <div className="wrap mb-4">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">Next drops</h2>
            <p className="mt-1 text-sm text-ink-soft">Hidden until the clock ends, then live for everyone.</p>
          </div>
          <div className="wrap grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4">
            {drops.map((item) => (
              <div key={item.id}>
                <ItemCard item={item} />
                {item.drops_at && (
                  <div className="mt-2">
                    <DropClock at={item.drops_at} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {shops.length > 0 && (
        <section className="border-b border-line bg-paper-dim/40 py-5 sm:py-6">
          <div className="wrap mb-3 flex items-end justify-between gap-4">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Shops
            </h2>
            <Link href="/sellers" className="text-sm font-semibold text-ink-faint hover:text-ink">
              All {stats.shops} shops
            </Link>
          </div>
          <ShopsCarousel sellers={shops} />
        </section>
      )}

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

      <section className="border-t border-line">
        <div className="wrap py-10 sm:py-12">
          <div className="max-w-md">
            <TopShopsWidget shops={weeklyTop.shops} weekStart={weeklyTop.weekStart} />
          </div>
        </div>
      </section>

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
