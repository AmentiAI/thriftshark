import Link from "next/link";
import { GoLiveForm } from "@/components/show-forms";
import { WinnerList } from "@/components/winner-list";
import { startLiveShow } from "@/lib/live-actions";
import { sellerShows } from "@/lib/live-shows";
import { sellerAuctionWins } from "@/lib/queries";
import { requireSeller } from "@/lib/seller-auth";
import { isSellerVerified, SELLER_PLAN_PRICE_USD } from "@/lib/seller-plan";
import { sellerIdVerified } from "@/lib/stripe-identity";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  const seller = await requireSeller();
  const [shows, wins] = await Promise.all([sellerShows(seller.id), sellerAuctionWins(seller.id)]);
  const ready = sellerIdVerified(seller) && isSellerVerified(seller);

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">Live shows</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Go live on Thrift Sharks. Name each item and set a starting price while you are on
          camera. YouTube and Instagram are optional.
        </p>
      </header>

      {ready ? (
        <section className="panel p-6">
          <h3 className="font-display text-xl font-bold">Go live</h3>
          <p className="mt-2 text-sm text-ink-soft">
            Add a thumbnail, then go live. That picture is the card people tap. YouTube and
            Instagram can wait until you are on camera.
          </p>
          <div className="mt-4">
            <GoLiveForm />
          </div>
        </section>
      ) : (
        <section className="panel p-6">
          <p className="text-sm text-ink-soft">
            Live shows need a verified ID and the Verified plan — ${SELLER_PLAN_PRICE_USD} for 30
            days. Auctions you already run stay on their own clocks.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!sellerIdVerified(seller) && (
              <Link href="/dashboard" className="btn btn-ink">
                Finish ID check
              </Link>
            )}
            {!isSellerVerified(seller) && (
              <Link href="/dashboard/verified" className="btn btn-ghost">
                Get Verified
              </Link>
            )}
          </div>
        </section>
      )}

      <WinnerList wins={wins} />

      <section>
        <h3 className="font-display text-xl font-bold">Your shows</h3>
        {shows.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No shows yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {shows.map((show) => (
              <li key={show.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/shows/${show.id}`} className="font-semibold hover:underline">
                    {show.title}
                  </Link>
                  <p className="text-xs text-ink-faint uppercase">{show.status}</p>
                </div>
                {show.status === "draft" && (
                  <form action={startLiveShow}>
                    <input type="hidden" name="show_id" value={show.id} />
                    <button className="btn bg-coral text-white hover:opacity-90">Go live</button>
                  </form>
                )}
                {show.status === "live" && (
                  <Link href={`/live/${show.id}`} className="text-sm font-semibold underline">
                    Watch page
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
