import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AuctionCard } from "@/components/auction-card";
import { Countdown } from "@/components/countdown";
import { ShopAvatar } from "@/components/shop-avatar";
import { auctionStats, listAuctions, minimumBid } from "@/lib/auctions";
import { money } from "@/lib/format";
import { currentSeller } from "@/lib/seller-auth";
import { imageSrc, type Auction } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auctions",
  description:
    "Timed auctions on clothes, shoes, and more from independent shops. Bid against the clock, pay the shop through Stripe.",
};

const RULES = [
  ["Anti-snipe", "A bid in the last 20 seconds adds 20 seconds to the clock. It sells only when the clock hits zero with no new bid."],
  ["Honest reserves", "If there’s a reserve, you’ll see whether it’s met."],
  ["Pay the shop", "Winners check out like a normal order — card payment to the seller."],
];

export default async function AuctionsPage() {
  const [live, ended, stats, seller] = await Promise.all([
    listAuctions("live"),
    listAuctions("ended"),
    auctionStats(),
    currentSeller(),
  ]);

  const featured = live[0] ?? null;
  const floor = live.slice(1);
  const listHref = seller ? "/dashboard/items/new" : "/signup?as=store";

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-12">
          <div className="max-w-xl">
            <p className="eyebrow-pill">
              {stats.live} live · {stats.bids} bids
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Auction house
            </h1>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">
              Shops put items up on a timer. Highest bid when it ends wins, and you
              pay that shop through Stripe.
            </p>
          </div>
          <Link href={listHref} className="btn btn-ink shrink-0">
            Auction an item
          </Link>
        </div>
      </section>

      <section id="floor" className="wrap py-10 sm:py-12">
        {featured ? (
          <FeaturedLot auction={featured} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-paper-dim px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">No lots live</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              Shops can auction a new listing, or move one they already have for sale.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={listHref} className="btn btn-ink">
                Auction an item
              </Link>
              <Link href="/shop" className="btn btn-ghost">
                Shop buy now
              </Link>
            </div>
          </div>
        )}
      </section>

      {floor.length > 0 && (
        <section className="wrap pb-12">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            On the clock
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
            {floor.map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section className="border-t border-line bg-paper-dim/50">
          <div className="wrap py-10 sm:py-12">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Recent results
            </h2>
            <div className="mt-6 scroll-x">
              <div className="flex w-max gap-4 pb-1">
                {ended.slice(0, 10).map((auction) => (
                  <div key={auction.id} className="w-56 shrink-0 sm:w-64">
                    <AuctionCard auction={auction} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="wrap py-12 sm:py-14">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          How a lot closes
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {RULES.map(([title, body], i) => (
            <div key={title} className="rounded-xl border border-line bg-paper p-5">
              <p className="text-xs font-semibold text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function FeaturedLot({ auction }: { auction: Auction }) {
  const src = imageSrc(auction.images[0]);
  const current = auction.high_cents ?? auction.start_cents;
  const reserveMet = auction.reserve_cents === null || current >= auction.reserve_cents;

  return (
    <article className="grid overflow-hidden rounded-2xl border border-line lg:grid-cols-2">
      <div className="relative aspect-[4/5] bg-paper-dim sm:aspect-[5/4] lg:aspect-auto lg:min-h-[28rem]">
        {src ? (
          <Image
            src={src}
            alt={auction.images[0].alt ?? auction.item_title}
            fill
            priority
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">No photo</div>
        )}
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold text-white uppercase">
          <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
          Closing first
        </span>
      </div>

      <div className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Lot {auction.id}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {auction.item_title}
          </h2>
          <Link
            href={`/shop/${auction.seller_handle}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line py-1.5 pr-3 pl-1.5 text-sm hover:border-ink"
          >
            <ShopAvatar
              shopName={auction.seller_shop_name}
              logoImageId={auction.seller_logo_image_id}
              size={28}
            />
            <span className="font-medium">{auction.seller_shop_name}</span>
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-xs text-ink-faint">
            {auction.bid_count === 0 ? "Opening bid" : "Current bid"}
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">{money(current)}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {auction.bid_count === 0
              ? "No bids yet"
              : `${auction.bid_count} bid${auction.bid_count === 1 ? "" : "s"}`}
            {auction.reserve_cents !== null &&
              (reserveMet ? " · reserve met" : " · reserve not met")}
          </p>
          <p className="mt-1 text-sm font-medium">Next bid {money(minimumBid(auction))}</p>

          <div className="mt-5">
            <p className="mb-1.5 text-xs text-ink-faint">Time left</p>
            <Countdown endsAt={auction.ends_at} />
          </div>

          <Link href={`/auctions/${auction.id}`} className="btn btn-ink mt-6 w-full sm:w-auto">
            Bid on this lot
          </Link>
        </div>
      </div>
    </article>
  );
}
