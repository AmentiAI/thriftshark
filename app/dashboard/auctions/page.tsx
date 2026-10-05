import Image from "next/image";
import Link from "next/link";
import { CreateAuctionForm } from "@/components/create-auction-form";
import { Countdown } from "@/components/countdown";
import { cancelAuction } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";
import { sellerAuctions } from "@/lib/auctions";
import { sellerItems } from "@/lib/queries";
import { imageSrc } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardAuctionsPage() {
  const seller = await requireSeller();
  const [auctions, items] = await Promise.all([
    sellerAuctions(seller.id),
    sellerItems(seller.id, "available"),
  ]);

  const live = auctions.filter((a) => a.status === "live");
  const past = auctions.filter((a) => a.status !== "live");

  return (
    <div className="space-y-12">
      <header>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Your auctions
        </h2>
        <p className="mt-2 text-ink-soft">
          {live.length} live · {past.length} finished. New pieces can go on the
          block from{" "}
          <Link href="/dashboard/items/new" className="font-semibold underline hover:text-reef-dark">
            Add a listing
          </Link>
          . A win becomes a normal order with your Cash App code on it.
        </p>
      </header>

      {live.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-extrabold tracking-tight">On the block now</h3>
          <ul className="mt-4 space-y-3">
            {live.map((auction) => {
              const src = imageSrc(auction.images[0]);
              return (
                <li
                  key={auction.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper-dim">
                    {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
                  </div>

                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="font-display font-bold hover:text-reef-dark"
                    >
                      {auction.item_title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      Lot {auction.id} · opened at {money(auction.start_cents)}
                      {auction.reserve_cents !== null &&
                        ` · reserve ${money(auction.reserve_cents)}`}
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      <Countdown endsAt={auction.ends_at} compact /> left
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold">
                      {money(auction.high_cents ?? auction.start_cents)}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {auction.bid_count} bid{auction.bid_count === 1 ? "" : "s"}
                    </p>
                  </div>

                  {auction.bid_count === 0 ? (
                    <form action={cancelAuction}>
                      <input type="hidden" name="id" value={auction.id} />
                      <button className="btn btn-ghost !px-3 !py-2 text-[11px]">Pull it</button>
                    </form>
                  ) : (
                    <span className="rounded-full bg-paper-dim px-3 py-1.5 text-[11px] font-bold text-ink-soft">
                      Locked in
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="font-display text-xl font-extrabold tracking-tight">
          Put a piece on the block
        </h3>
        <p className="mt-1.5 mb-5 text-sm text-ink-soft">
          Pick one of your live listings, set an opening bid and a clock.
        </p>
        <CreateAuctionForm items={items} />
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-extrabold tracking-tight">Finished</h3>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {past.map((auction) => (
              <li key={auction.id} className="flex flex-wrap items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <Link
                    href={`/auctions/${auction.id}`}
                    className="font-semibold hover:text-reef-dark"
                  >
                    {auction.item_title}
                  </Link>
                  <p className="text-xs text-ink-faint">
                    Lot {auction.id} · closed {shortDate(auction.settled_at ?? auction.ends_at)}
                  </p>
                </div>
                <p className="text-sm">
                  {auction.bid_count} bid{auction.bid_count === 1 ? "" : "s"}
                </p>
                <p className="w-24 text-right font-display font-extrabold">
                  {auction.high_cents ? money(auction.high_cents) : "—"}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                    auction.status === "sold"
                      ? "bg-kelp/15 text-kelp"
                      : auction.status === "cancelled"
                        ? "bg-paper-dim text-ink-soft"
                        : "bg-gold/20 text-ink"
                  }`}
                >
                  {auction.status === "sold"
                    ? "Sold"
                    : auction.status === "cancelled"
                      ? "Pulled"
                      : "Unsold"}
                </span>
                {auction.status === "sold" && (
                  <Link
                    href="/dashboard/orders"
                    className="text-xs font-semibold underline hover:text-reef-dark"
                  >
                    See order
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
