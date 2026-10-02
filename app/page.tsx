import Link from "next/link";
import Image from "next/image";
import { ItemCard } from "@/components/item-card";
import { SellerCard } from "@/components/seller-card";
import { ShopRail } from "@/components/shop-rail";
import { LiveDrop } from "@/components/live-drop";
import { AuctionCard } from "@/components/auction-card";
import { SharkMark } from "@/components/logo";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { StaggerWords } from "@/components/motion/stagger-words";
import { TiltCard } from "@/components/motion/tilt-card";
import { Spotlight } from "@/components/motion/spotlight";
import { liveAuctions } from "@/lib/auctions";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedItems,
  getLatestItems,
  getStockedSellers,
  listSellers,
  marketplaceStats,
} from "@/lib/queries";
export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Open your shop",
    body: "Name it, claim your link, drop in your $cashtag. No fees, no approval queue — live in about a minute.",
  },
  {
    title: "Put your logo on it",
    body: "Upload a logo and a banner. Your name and your mark ride along on every listing you post.",
  },
  {
    title: "List your merch",
    body: "Six photos, a price, a size. One-of-one stock, so it leaves the rack the second it sells.",
  },
  {
    title: "Get paid direct",
    body: "Buyers scan your Cash App code and send you the total. Not a cent passes through us.",
  },
];

export default async function HomePage() {
  const [featured, latest, categories, counts, railSellers, gridSellers, stats, auctions] =
    await Promise.all([
      getFeaturedItems(4),
      getLatestItems(8),
      getCategories(),
      getCategoryCounts(),
      listSellers({ featuredFirst: true, limit: 14 }),
      getStockedSellers(6),
      marketplaceStats(),
      liveAuctions(4),
    ]);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="blob -top-40 -right-24 h-[34rem] w-[34rem] bg-reef/35" />
          <span
            className="blob top-1/3 -left-32 h-[26rem] w-[26rem] bg-foam/25"
            style={{ "--blob-duration": "34s" } as React.CSSProperties}
          />
          <span
            className="blob -bottom-32 left-1/3 h-[22rem] w-[22rem] bg-gold/20"
            style={{ "--blob-duration": "41s" } as React.CSSProperties}
          />
        </div>

        <div className="wrap relative grid items-center gap-14 pt-16 pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:pt-24">
          <div>
            <Reveal variant="left">
              <p className="eyebrow-pill">
                <SharkMark className="h-3.5 w-3.5 swim" />
                <span className="live-dot relative mr-1 inline-block h-1.5 w-1.5 rounded-full text-white" />
                {stats.shops} shops · {stats.listings} finds live
              </p>
            </Reveal>

            <h1 className="mt-6 font-display text-6xl leading-[0.84] font-extrabold tracking-[-0.05em] sm:text-7xl lg:text-[6.6rem]">
              <StaggerWords text="Your closet." className="block" />
              <StaggerWords
                text="Your shop."
                className="block text-reef"
                delay={320}
              />
            </h1>

            <Reveal delay={420}>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-paper/70">
                A marketplace for one-of-one secondhand. Open a shop in a
                minute, put your own logo on it, list your merch — and get paid
                straight to your Cash App.
              </p>
            </Reveal>

            <Reveal delay={520}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-lime sheen">
                  Open your shop
                </Link>
                <Link href="/shop" className="btn btn-ghost-light">
                  Shop {stats.listings} finds
                </Link>
              </div>
            </Reveal>

            <Reveal delay={620}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-3">
                {[
                  { value: stats.shops, label: "shops open" },
                  { value: stats.listings, label: "pieces for sale" },
                  { value: stats.sold, label: "already gone" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/6 px-3 py-4 ring-1 ring-white/10 transition hover:bg-white/10 sm:px-4"
                  >
                    <dt className="font-display text-2xl font-extrabold tracking-tight whitespace-nowrap text-reef sm:text-3xl">
                      <CountUp to={stat.value} />
                    </dt>
                    <dd className="mt-1 text-[11px] text-paper/60 sm:text-xs">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal variant="scale" delay={200} className="relative">
            <TiltCard max={6} className="relative">
              <div className="relative aspect-[3/2]">
                <Image
                  src="/crest.png"
                  alt="Thrift Sharks"
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-contain"
                />
              </div>
            </TiltCard>
          </Reveal>
        </div>

        {/* Just-listed ticker */}
        <div className="relative border-t border-white/10 py-5">
          <p className="wrap mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-paper/50 uppercase">
            <span className="live-dot relative inline-block h-2 w-2 rounded-full text-reef" />
            Just listed
          </p>
          <LiveDrop items={latest} />
        </div>
      </section>

      {/* ---------------- Shop rail ---------------- */}
      {railSellers.length > 0 && (
        <section className="border-b border-line bg-paper-dim/40 py-8">
          <p className="wrap mb-5 text-[11px] font-bold tracking-[0.2em] text-ink-faint uppercase">
            Sellers you can buy from today
          </p>
          <ShopRail sellers={railSellers} />
        </section>
      )}

      {/* ---------------- Just landed ---------------- */}
      <section className="wrap py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="eyebrow text-ink-faint">Fresh off the rack</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Just landed
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/shop?sort=newest" className="btn btn-ghost !px-4 !py-2 text-xs">
              See everything new
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((item, i) => (
            <Reveal key={item.id} variant="scale" delay={i * 70}>
              <TiltCard max={5}>
                <ItemCard item={item} priority={i < 2} />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Auction house ---------------- */}
      {auctions.length > 0 && (
        <section className="relative isolate overflow-hidden bg-ink py-20 text-paper">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <span className="blob -top-32 right-0 h-96 w-96 bg-coral/25" />
            <span
              className="blob -bottom-28 -left-16 h-80 w-80 bg-reef/30"
              style={{ "--blob-duration": "37s" } as React.CSSProperties}
            />
          </div>

          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Reveal>
                <p className="eyebrow-pill">
                  <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
                  Auction house
                </p>
                <h2 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-5xl">
                  Going, going…
                </h2>
                <p className="mt-3 max-w-xl text-paper/65">
                  Hard close, no extensions. Highest bid when the clock runs out
                  takes the lot.
                </p>
              </Reveal>
              <Reveal delay={140}>
                <Link href="/auctions" className="btn btn-lime sheen">
                  All live lots
                </Link>
              </Reveal>
            </div>

            <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {auctions.map((auction, i) => (
                <Reveal key={auction.id} variant="scale" delay={i * 80}>
                  <AuctionCard auction={auction} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Shops ---------------- */}
      {gridSellers.length > 0 && (
        <section className="wrap pb-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <p className="eyebrow-pill">The shops</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                Who&apos;s selling
              </h2>
              <p className="mt-3 max-w-xl text-ink-soft">
                Independent sellers running their own storefronts. Find the ones
                whose taste you trust and watch what they post.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Link href="/sellers" className="btn btn-ink">
                All {stats.shops} shops
              </Link>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridSellers.map((seller, i) => (
              <Reveal key={seller.id} delay={i * 80}>
                <SellerCard seller={seller} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Categories ---------------- */}
      <section className="wrap pb-20">
        <div className="flex items-end justify-between gap-4">
          <Reveal>
            <p className="eyebrow text-ink-faint">Categories</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Dig through
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/shop" className="btn btn-ghost !px-4 !py-2 text-xs">
              All categories
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.slug} variant="scale" delay={i * 60}>
              <Link
                href={`/shop?category=${c.slug}`}
                className={`sheen group flex min-h-48 flex-col justify-between rounded-[1.6rem] p-6 transition duration-300 hover:-translate-y-1.5 ${
                  i % 4 === 0 ? "bg-ink text-paper" : "bg-white ring-1 ring-black/5"
                }`}
              >
                <p
                  className={`font-display text-4xl font-extrabold tracking-tight ${
                    i % 4 === 0 ? "text-reef" : "text-ink"
                  }`}
                >
                  <CountUp to={counts[c.slug] ?? 0} duration={1100} />
                </p>
                <div>
                  <h3 className="font-display text-2xl font-extrabold tracking-tight">
                    <span className="underline-grow">{c.name}</span>
                  </h3>
                  {c.blurb && (
                    <p
                      className={`mt-1.5 text-sm leading-snug ${
                        i % 4 === 0 ? "text-paper/65" : "text-ink-soft"
                      }`}
                    >
                      {c.blurb}
                    </p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Featured ---------------- */}
      {featured.length > 0 && (
        <section className="wrap pb-20">
          <Reveal>
            <p className="eyebrow-pill">Featured</p>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Picked out this week
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item, i) => (
              <Reveal key={item.id} variant="scale" delay={i * 70}>
                <TiltCard max={5}>
                  <ItemCard item={item} />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Seller pitch ---------------- */}
      <Spotlight className="overflow-hidden bg-ink text-paper">
        <section className="wrap py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow-pill">Start selling</p>
              <h2 className="mt-4 max-w-xl font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-6xl">
                Sell your own merch, keep every dollar.
              </h2>
              <p className="mt-4 max-w-xl text-paper/65">
                Four steps, no fees, no commission. The money goes from the
                buyer&apos;s Cash App straight into yours.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <Link href="/signup" className="btn btn-lime sheen">
                Open your shop free
              </Link>
            </Reveal>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} as="li" delay={i * 110}>
                <div className="group h-full rounded-[1.6rem] bg-white/6 p-6 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1.5 hover:bg-white/12">
                  <p className="font-display text-4xl font-extrabold text-reef transition group-hover:text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/65">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={200}>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8 text-sm text-paper/55">
              {["0% commission", "No listing fees", "Live instantly", "Paid to Cash App"].map(
                (line) => (
                  <span key={line} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-reef" />
                    {line}
                  </span>
                ),
              )}
            </div>
          </Reveal>
        </section>
      </Spotlight>
    </>
  );
}
