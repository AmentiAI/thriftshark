import Link from "next/link";
import type { Metadata } from "next";
import { LiveCard } from "@/components/live-card";
import { listLiveShows } from "@/lib/live-shows";
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
            Shops go live on camera, show an item, and set a starting price. Viewers bid,
            like, and comment as it happens.
          </p>
        </div>
        <Link href={ready ? "/dashboard/shows" : goLiveHref} className="btn bg-coral text-white hover:opacity-90">
          Go live
        </Link>
      </div>

      {shows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <h2 className="font-display text-xl font-bold">No show is live</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Set a thumbnail, then go live. That picture is the card people tap.
          </p>
          <div className="mt-5">
            <Link href={ready ? "/dashboard/shows" : goLiveHref} className="btn bg-coral text-white hover:opacity-90">
              Go live
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {shows.map((show) => (
            <LiveCard key={show.id} show={show} />
          ))}
        </ul>
      )}
    </div>
  );
}
