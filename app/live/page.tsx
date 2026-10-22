import Link from "next/link";
import type { Metadata } from "next";
import { GoLiveButton } from "@/components/show-forms";
import { ShopAvatar } from "@/components/shop-avatar";
import { listLiveShows } from "@/lib/live-shows";
import { money } from "@/lib/format";
import { currentBuyer } from "@/lib/buyer-account";
import { isSellerVerified } from "@/lib/seller-plan";
import { currentSeller } from "@/lib/seller-auth";
import { sellerIdVerified } from "@/lib/stripe-identity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live auctions",
  description: "Shops hosting live auction shows. Bid on Thrift Sharks.",
};

export default async function LiveIndexPage() {
  const [shows, seller, buyer] = await Promise.all([listLiveShows(), currentSeller(), currentBuyer()]);
  const ready = Boolean(seller && sellerIdVerified(seller) && isSellerVerified(seller));
  const goLiveHref = seller ? "/dashboard/shows" : buyer ? "/sell" : "/login?next=/dashboard/shows";

  return (
    <div className="wrap py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow-pill">Live</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Auction shows</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Go live on Thrift Sharks, hold up an object, and set a price. People bid, like, and
            comment on that piece. YouTube and Instagram are optional.
          </p>
        </div>
        {ready ? (
          <GoLiveButton />
        ) : (
          <Link href={goLiveHref} className="btn bg-coral text-white hover:opacity-90">
            Go live
          </Link>
        )}
      </div>

      {shows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <h2 className="font-display text-xl font-bold">No show is live</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Press Go live to start on Thrift Sharks. You can add YouTube or Instagram after, or skip them.
          </p>
          <div className="mt-5">
            {ready ? (
              <GoLiveButton />
            ) : (
              <Link href={goLiveHref} className="btn bg-coral text-white hover:opacity-90">
                Go live
              </Link>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {shows.map((show) => {
            const lot = show.lots.find((item) => item.auction_id === show.current_auction_id);
            return (
              <li key={show.id}>
                <Link href={`/live/${show.id}`} className="panel block p-5 hover:border-ink">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-coral uppercase">
                    <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
                    Live
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">{show.title}</h2>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm">
                    <ShopAvatar
                      shopName={show.seller_shop_name}
                      logoImageId={show.seller_logo_image_id}
                      size={28}
                    />
                    {show.seller_shop_name}
                  </p>
                  <p className="mt-3 text-sm text-ink-soft">
                    {lot
                      ? `On stage: ${lot.title} · ${money(lot.high_cents ?? lot.start_cents)} · ${lot.like_count} like${lot.like_count === 1 ? "" : "s"}`
                      : "On camera. Bidding opens when they name a piece."}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
