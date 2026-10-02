import Link from "next/link";
import type { Metadata } from "next";
import { AuctionCard } from "@/components/auction-card";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { auctionStats, listAuctions } from "@/lib/auctions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The auction house",
  description:
    "Timed auctions on one-of-one secondhand. Bid against the clock, win the lot, pay the shop straight over Cash App.",
};

export default async function AuctionsPage(props: PageProps<"/auctions">) {
  const params = await props.searchParams;
  const tab = (Array.isArray(params.tab) ? params.tab[0] : params.tab) === "ended" ? "ended" : "live";

  const [auctions, stats] = await Promise.all([listAuctions(tab), auctionStats()]);

  return (
    <div className="wrap py-12">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-ink p-8 text-paper sm:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="blob -top-24 -right-16 h-96 w-96 bg-coral/30" />
          <span
            className="blob -bottom-28 left-1/4 h-80 w-80 bg-reef/30"
            style={{ "--blob-duration": "33s" } as React.CSSProperties}
          />
        </div>

        <Reveal>
          <p className="eyebrow-pill">
            <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
            {stats.live} lots live
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.05em] sm:text-6xl">
            The auction
            <span className="block text-reef">house.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/70">
            One of one, one chance. Sellers put their best pieces on the clock —
            highest bid when it runs out takes it, and pays the shop straight
            over Cash App.
          </p>
        </Reveal>

        <Reveal delay={160}>
          <dl className="mt-9 flex flex-wrap gap-3">
            {[
              { value: stats.live, label: "live lots" },
              { value: stats.bids, label: "bids placed" },
              { value: stats.sold, label: "lots won" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/6 px-5 py-4 ring-1 ring-white/10">
                <dt className="font-display text-2xl font-extrabold tracking-tight text-reef">
                  <CountUp to={stat.value} />
                </dt>
                <dd className="mt-1 text-xs text-paper/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2">
        <Link href="/auctions" className={`btn !px-5 !py-2.5 text-xs ${tab === "live" ? "btn-ink" : "btn-ghost"}`}>
          Live now
        </Link>
        <Link
          href="/auctions?tab=ended"
          className={`btn !px-5 !py-2.5 text-xs ${tab === "ended" ? "btn-ink" : "btn-ghost"}`}
        >
          Results
        </Link>
        <Link href="/sell" className="btn btn-ghost !px-5 !py-2.5 text-xs">
          Auction your own
        </Link>
      </nav>

      {auctions.length === 0 ? (
        <div className="panel mt-8 px-6 py-20 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {tab === "live" ? "No lots on the block right now" : "No results yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            {tab === "live"
              ? "Auctions come and go fast. Check the shops in the meantime, or put one of your own pieces up."
              : "Once lots start closing, every result lands here."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-ink">
              Shop buy-now
            </Link>
            <Link href="/signup" className="btn btn-ghost">
              Open a shop
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {auctions.map((auction, i) => (
            <Reveal key={auction.id} variant="scale" delay={i * 70}>
              <AuctionCard auction={auction} priority={i < 4} />
            </Reveal>
          ))}
        </div>
      )}

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          ["Bid against the clock", "Every lot has a hard end time. The high bid when the clock hits zero wins — no sniping extensions, no proxy bids."],
          ["Reserves are shown", "If a seller set a reserve you will see whether it has been met. Miss it and the piece simply goes back on the rack."],
          ["Winners pay the shop", "A win becomes a normal order with that shop's Cash App code on it. Scan, send, and they post it out."],
        ].map(([title, body], i) => (
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
      </section>
    </div>
  );
}
