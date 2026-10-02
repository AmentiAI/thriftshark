import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BidForm } from "@/components/bid-form";
import { ClaimWinForm } from "@/components/claim-win-form";
import { Countdown } from "@/components/countdown";
import { ItemGallery } from "@/components/item-gallery";
import { ShopAvatar } from "@/components/shop-avatar";
import { AuctionCard } from "@/components/auction-card";
import { Reveal } from "@/components/motion/reveal";
import { money, shortDate } from "@/lib/format";
import { auctionBids, getAuction, liveAuctions, minimumBid } from "@/lib/auctions";
import { conditionLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/auctions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const auction = await getAuction(Number(id));
  if (!auction) return { title: "Lot not found" };

  return {
    title: `${auction.item_title} — lot ${auction.id}`,
    description: `Live auction from ${auction.seller_shop_name}. Current bid ${money(
      auction.high_cents ?? auction.start_cents,
    )}.`,
  };
}

/** Public bid history shows a first name and an initial, never an email. */
function maskName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const initial = rest.length > 0 ? ` ${rest[rest.length - 1][0].toUpperCase()}.` : "";
  return `${first}${initial}`;
}

export default async function AuctionPage(props: PageProps<"/auctions/[id]">) {
  const { id } = await props.params;
  const auctionId = Number(id);
  if (!Number.isInteger(auctionId)) notFound();

  const auction = await getAuction(auctionId);
  if (!auction || auction.status === "cancelled") notFound();

  const [bids, alsoLive] = await Promise.all([
    auctionBids(auction.id),
    liveAuctions(5),
  ]);

  const live = auction.status === "live";
  const current = auction.high_cents ?? auction.start_cents;
  const reserveMet =
    auction.reserve_cents === null || current >= auction.reserve_cents;
  const others = alsoLive.filter((a) => a.id !== auction.id).slice(0, 4);

  const spec = [
    ["Brand", auction.item_brand],
    ["Size", auction.item_size],
    ["Condition", conditionLabel(auction.item_condition)],
    ["Opening bid", money(auction.start_cents)],
    ["Increment", money(auction.increment_cents)],
    ["Closes", shortDate(auction.ends_at)],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="wrap py-10">
      <nav className="mb-8 flex flex-wrap gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/auctions" className="hover:text-ink">Auction house</Link>
        <span>/</span>
        <span className="text-ink">Lot {auction.id}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ItemGallery images={auction.images} title={auction.item_title} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {live ? (
              <span className="flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
                <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
                Bidding open
              </span>
            ) : (
              <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-paper uppercase">
                {auction.status === "sold" ? "Sold" : "Ended unsold"}
              </span>
            )}
            {auction.reserve_cents !== null && (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase ${
                  reserveMet ? "bg-kelp/15 text-kelp" : "bg-gold/20 text-ink"
                }`}
              >
                {reserveMet ? "Reserve met" : "Reserve not met"}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-5xl">
            {auction.item_title}
          </h1>

          <Link
            href={`/shop/${auction.seller_handle}`}
            className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-4 pl-1.5 ring-1 ring-black/5 transition hover:ring-ink"
          >
            <ShopAvatar
              shopName={auction.seller_shop_name}
              logoImageId={auction.seller_logo_image_id}
              size={30}
            />
            <span className="text-sm font-bold">{auction.seller_shop_name}</span>
            <span className="text-xs text-ink-faint">Visit shop →</span>
          </Link>

          {/* Current bid + clock */}
          <div className="panel mt-7 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-ink-faint">
                  {auction.bid_count === 0 ? "Opening bid" : "Current bid"}
                </p>
                <p className="mt-1 font-display text-5xl leading-none font-extrabold tracking-tight">
                  {money(current)}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {auction.bid_count === 0
                    ? "No bids yet — open it."
                    : `${auction.bid_count} bid${auction.bid_count === 1 ? "" : "s"}${
                        auction.high_bidder ? ` · high bidder ${maskName(auction.high_bidder)}` : ""
                      }`}
                </p>
              </div>

              {live ? (
                <div>
                  <p className="eyebrow mb-2 text-ink-faint">Time left</p>
                  <Countdown endsAt={auction.ends_at} />
                </div>
              ) : (
                <p className="text-sm font-semibold text-ink-soft">
                  Closed {shortDate(auction.settled_at ?? auction.ends_at)}
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-line pt-6">
              {live ? (
                <BidForm
                  auctionId={auction.id}
                  minimum={minimumBid(auction)}
                  increment={auction.increment_cents}
                />
              ) : auction.status === "sold" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-kelp/10 px-4 py-3 text-sm">
                    <strong>Won at {money(current)}</strong>
                    {auction.high_bidder && ` by ${maskName(auction.high_bidder)}`}. The
                    winner pays {auction.seller_shop_name} over Cash App
                    {auction.seller_cashapp_tag && ` ($${auction.seller_cashapp_tag})`}.
                  </div>
                  <ClaimWinForm auctionId={auction.id} />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="rounded-2xl bg-paper-dim px-4 py-3 text-sm text-ink-soft">
                    This lot closed without meeting its reserve, so it went back
                    on the rack at a fixed price.
                  </p>
                  <Link href={`/item/${auction.item_slug}`} className="btn btn-ink w-full">
                    See it in the shop
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="eyebrow text-ink-faint">The honest description</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">
              {auction.item_description || "No notes on this lot yet — ask the shop."}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {spec.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                <dt className="text-[11px] font-bold tracking-[0.14em] text-ink-faint uppercase">
                  {k}
                </dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Bid history */}
      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Bid history
          </h2>
          {bids.length === 0 ? (
            <p className="panel mt-4 px-5 py-10 text-center text-sm text-ink-soft">
              Nobody has bid yet. Be first and set the pace.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {bids.map((bid, i) => (
                <li key={bid.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="flex items-center gap-2.5 text-sm">
                    {i === 0 && live && (
                      <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        High
                      </span>
                    )}
                    <span className="font-semibold">{maskName(bid.bidder_name)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display font-extrabold">
                      {money(bid.amount_cents)}
                    </span>
                    <span className="block text-[11px] text-ink-faint">
                      {new Date(bid.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            How this lot works
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Hard close.</strong> Bidding stops at
              the posted time. There are no extensions, so a late bid has to land
              before the clock does.
            </li>
            <li>
              <strong className="text-ink">Minimum increments.</strong> Each bid
              must beat the current high by at least{" "}
              {money(auction.increment_cents)}.
            </li>
            <li>
              <strong className="text-ink">
                {auction.reserve_cents === null ? "No reserve." : "Reserve set."}
              </strong>{" "}
              {auction.reserve_cents === null
                ? "Whatever the high bid is at the close takes it."
                : "If the close is under the shop's hidden reserve, nobody wins and the piece returns to the shop."}
            </li>
            <li>
              <strong className="text-ink">Paying.</strong> The win turns into a
              normal order carrying {auction.seller_shop_name}&apos;s Cash App
              code. You scan it, send the total, they ship.
            </li>
          </ol>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Also on the block
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
            {others.map((other, i) => (
              <Reveal key={other.id} variant="scale" delay={i * 70}>
                <AuctionCard auction={other} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
