import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AuctionCard } from "@/components/auction-card";
import { Countdown } from "@/components/countdown";
import { SharkMark } from "@/components/logo";
import { ShopAvatar } from "@/components/shop-avatar";
import { CountUp } from "@/components/motion/count-up";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { Spotlight } from "@/components/motion/spotlight";
import { StaggerWords } from "@/components/motion/stagger-words";
import { TiltCard } from "@/components/motion/tilt-card";
import { auctionStats, listAuctions, minimumBid } from "@/lib/auctions";
import { money } from "@/lib/format";
import { currentSeller } from "@/lib/seller-auth";
import { imageSrc, type Auction } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The auction house",
  description:
    "Timed auctions on one-of-one secondhand. Bid against the clock, win the lot, pay the shop straight over Cash App.",
};

const HOUSE_LINES = [
  "Hard close",
  "No extensions",
  "One of one",
  "Reserve shown",
  "Pay the shop direct",
  "Highest bid takes it",
];

const RULES = [
  ["The clock is the hammer", "Every lot has a hard end. The high bid when it hits zero wins. No sniping extensions, no proxy bids."],
  ["Reserves stay honest", "If a seller set a reserve, the floor shows whether it is met. Miss it and the piece goes back on the rack."],
  ["Winners pay the shop", "A win becomes a normal order with that shop's Cash App code. Scan, send, and they post it out."],
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
  const listHref = seller ? "/dashboard/items/new" : "/signup";
  const moveHref = seller ? "/dashboard/auctions" : "/login";
  const ticker = live.length
    ? live.map((lot) => `${lot.item_title} · ${money(lot.high_cents ?? lot.start_cents)}`)
    : HOUSE_LINES;

  return (
    <>
      <Spotlight className="relative isolate overflow-hidden bg-ink text-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="blob -top-40 -right-24 h-[34rem] w-[34rem] bg-reef/40" />
          <span
            className="blob top-1/2 -left-32 h-[26rem] w-[26rem] bg-gold/25"
            style={{ "--blob-duration": "34s" } as React.CSSProperties}
          />
          <span
            className="blob -bottom-40 right-1/4 h-[22rem] w-[22rem] bg-blood/40"
            style={{ "--blob-duration": "41s" } as React.CSSProperties}
          />
        </div>

        <div className="wrap grid items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <Reveal>
              <p className="eyebrow-pill">
                <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
                {stats.live} {stats.live === 1 ? "lot" : "lots"} live
              </p>
            </Reveal>
            <h1 className="mt-5 font-display text-5xl leading-[0.88] font-extrabold tracking-[-0.05em] sm:text-7xl">
              <StaggerWords text="The floor is open." />
            </h1>
            <Reveal delay={280}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
                Skip the rack. Sellers put a piece on the clock, the room bids,
                and the high bid when time runs out takes it — then pays that
                shop straight over Cash App.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={listHref} className="btn btn-lime sheen">
                  Auction a piece
                </Link>
                <Link href={moveHref} className="btn btn-ghost-light">
                  Move a listing
                </Link>
              </div>
            </Reveal>
            <Reveal delay={440}>
              <dl className="mt-10 flex flex-wrap gap-3">
                {[
                  [stats.live, "live lots"],
                  [stats.bids, "bids placed"],
                  [stats.sold, "lots won"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/8 px-5 py-4 ring-1 ring-white/10">
                    <dt className="font-display text-3xl font-extrabold tracking-tight text-gold">
                      <CountUp to={Number(value)} />
                    </dt>
                    <dd className="mt-1 text-xs tracking-wide text-paper/60 uppercase">{label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal variant="scale" delay={180} className="relative">
            <div className="float-slow relative mx-auto aspect-[3/2] w-full max-w-lg">
              <Image
                src="/crest.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-contain"
              />
            </div>
            <SharkMark className="swim absolute -bottom-2 left-6 h-10 w-10 text-foam" />
          </Reveal>
        </div>

        <Marquee speed={38} className="border-t border-white/10 bg-black/40 py-3.5">
          {ticker.map((line, i) => (
            <span
              key={`${line}-${i}`}
              className="flex items-center gap-3 px-2 text-[11px] font-bold tracking-[0.18em] text-paper/80 uppercase"
            >
              <span className="text-gold" aria-hidden>
                ★
              </span>
              {line}
            </span>
          ))}
        </Marquee>
      </Spotlight>

      <section id="floor" className="wrap relative z-10 py-14">
        {featured ? (
          <FeaturedLot auction={featured} />
        ) : (
          <Reveal variant="scale">
            <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-paper ring-1 ring-white/10 sm:px-12">
              <p className="eyebrow text-gold">The block is clear</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                No lots up. Yours could be.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-paper/70">
                Open a lot from a new listing, or move something already on your rack onto the clock.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={listHref} className="btn btn-lime sheen">
                  Auction a piece
                </Link>
                <Link href="/shop" className="btn btn-ghost-light">
                  Shop buy-now
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {floor.length > 0 && (
        <section className="wrap py-16">
          <Reveal>
            <p className="eyebrow text-ink-faint">Still on the clock</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              The floor
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
            {floor.map((auction, i) => (
              <Reveal key={auction.id} variant="scale" delay={i * 60}>
                <TiltCard max={5}>
                  <AuctionCard auction={auction} priority={i < 2} />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section className="border-y border-line bg-paper-dim/50 py-16">
          <div className="wrap mb-8 flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <p className="eyebrow text-ink-faint">The hammer fell</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.04em]">
                Results
              </h2>
            </Reveal>
          </div>
          <div className="wrap">
            <div className="scroll-x">
              <div className="flex w-max gap-4 pb-2">
                {ended.slice(0, 10).map((auction, i) => (
                  <Reveal key={auction.id} variant="scale" delay={i * 50} className="w-64 shrink-0">
                    <AuctionCard auction={auction} />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="wrap py-20">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            How a lot closes
          </h2>
          <span className="strike mt-4 block h-1 w-24 rounded-full bg-reef" />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {RULES.map(([title, body], i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="h-full rounded-[1.6rem] bg-white p-6 ring-1 ring-black/5">
                <p className="font-display text-3xl font-extrabold text-reef">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-ink py-20 text-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="blob -top-24 right-0 h-80 w-80 bg-reef/30" />
        </div>
        <div className="wrap grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <p className="eyebrow text-gold">Sellers</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-5xl">
              Don&apos;t just rack it. Auction it.
            </h2>
            <p className="mt-4 max-w-lg text-paper/70">
              When you add a listing, choose Auction house. Set an opening bid, a hidden reserve, and how long the floor has. It leaves the shop until the lot closes.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex flex-wrap gap-3">
              <Link href={listHref} className="btn btn-lime sheen">
                Open a lot
              </Link>
              <Link href="/auctions#floor" className="btn btn-ghost-light">
                Watch the floor
              </Link>
            </div>
          </Reveal>
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
    <Reveal variant="scale">
      <article className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-40px_rgb(7_24_44/0.7)] ring-1 ring-black/10 lg:grid-cols-2">
        <TiltCard max={6} className="relative h-full bg-paper-dim">
          <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[34rem]">
            {src ? (
              <Image
                src={src}
                alt={auction.images[0].alt ?? auction.item_title}
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="kenburns object-contain p-6"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-faint">No photo</div>
            )}
            <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
              <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
              Closing first
            </span>
          </div>
        </TiltCard>

        <div className="flex flex-col justify-between bg-ink p-6 text-paper sm:p-10">
          <div>
            <p className="eyebrow text-gold">Lot {auction.id}</p>
            <h2 className="mt-3 font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-5xl">
              {auction.item_title}
            </h2>
            <Link
              href={`/shop/${auction.seller_handle}`}
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-white/10 py-1.5 pr-4 pl-1.5 ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <ShopAvatar
                shopName={auction.seller_shop_name}
                logoImageId={auction.seller_logo_image_id}
                size={28}
              />
              <span className="text-sm font-bold">{auction.seller_shop_name}</span>
            </Link>
          </div>

          <div className="mt-8">
            <p className="eyebrow text-paper/50">
              {auction.bid_count === 0 ? "Opening bid" : "Current bid"}
            </p>
            <p className="bid-throb mt-1 origin-left font-display text-5xl font-extrabold tracking-tight text-gold sm:text-6xl">
              {money(current)}
            </p>
            <p className="mt-2 text-sm text-paper/65">
              {auction.bid_count === 0
                ? "No bids yet — open it."
                : `${auction.bid_count} bid${auction.bid_count === 1 ? "" : "s"}`}
              {auction.reserve_cents !== null && (reserveMet ? " · reserve met" : " · reserve not met")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foam">Next bid {money(minimumBid(auction))}</p>

            <div className="mt-6">
              <p className="eyebrow mb-2 text-paper/50">Time left</p>
              <Countdown endsAt={auction.ends_at} surface="glass" />
            </div>

            <Link href={`/auctions/${auction.id}`} className="btn btn-lime sheen mt-8 w-full sm:w-auto">
              Bid on this lot
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
