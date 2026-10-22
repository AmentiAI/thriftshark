import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { LiveBid } from "@/components/live-bid";
import { LiveCommentBar } from "@/components/live-comment-bar";
import { LiveHud } from "@/components/live-hud";
import { LiveRefresh } from "@/components/live-refresh";
import { LiveViewer } from "@/components/live-viewer";
import { SelfCamera } from "@/components/self-camera";
import { LotReactions } from "@/components/lot-reactions";
import { ShopAvatar } from "@/components/shop-avatar";
import { currentBuyer } from "@/lib/buyer-account";
import { money } from "@/lib/format";
import { getShow, lotCrowd, lotOutcome } from "@/lib/live-shows";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/live/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const show = await getShow(Number(id));
  if (!show) return { title: "Show not found" };
  return {
    title: show.title,
    description: `${show.seller_shop_name} is hosting a live auction. Bid on Thrift Sharks.`,
  };
}

export default async function LiveShowPage(props: PageProps<"/live/[id]">) {
  const { id } = await props.params;
  const showId = Number(id);
  if (!Number.isInteger(showId)) notFound();
  const show = await getShow(showId);
  if (!show || show.status === "draft") notFound();

  const lot = show.lots.find((item) => item.auction_id === show.current_auction_id) ?? null;
  const bidding = Boolean(lot && lot.auction_status === "live" && new Date(lot.ends_at).getTime() > Date.now());
  const buyer = await currentBuyer();
  const seller = buyer ? null : await currentSeller();
  const crowd = lot
    ? await lotCrowd(lot.auction_id, { buyerId: buyer?.id ?? null, sellerId: seller?.id ?? null })
    : null;
  const minimum = lot ? (lot.high_cents == null ? lot.start_cents : lot.high_cents + lot.increment_cents) : 0;
  const bidder = buyer
    ? { name: buyer.name, email: buyer.email }
    : seller
      ? { name: seller.shop_name, email: seller.email }
      : null;
  const hosting = seller?.id === show.seller_id;
  const outcome = lot && !bidding ? lotOutcome(lot) : null;
  const stageHud = (
    <LiveHud
      title={lot?.title ?? null}
      amount={lot ? money(lot.high_cents ?? lot.start_cents) : null}
      endsAt={bidding && lot ? lot.ends_at : null}
      outcome={outcome}
      notes={crowd?.notes ?? []}
      lifted={bidding && !hosting}
    />
  );

  return (
    <div className={`wrap py-4 sm:py-10 ${bidding && !hosting ? "pb-44 sm:pb-10" : ""}`}>
      <LiveRefresh active={show.status === "live"} />
      <div className="flex flex-wrap items-center gap-3">
        {show.status === "live" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
            <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
            Live
          </span>
        ) : (
          <span className="rounded-full bg-paper-dim px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase">
            Ended
          </span>
        )}
        <Link href={`/shop/${show.seller_handle}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ShopAvatar shopName={show.seller_shop_name} logoImageId={show.seller_logo_image_id} size={28} />
          <span className="break-anywhere">{show.seller_shop_name}</span>
        </Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,22rem)] lg:items-start">
        {hosting && show.status === "live" ? (
          <SelfCamera>{stageHud}</SelfCamera>
        ) : show.status === "live" ? (
          <LiveViewer showId={show.id} active>
            {stageHud}
          </LiveViewer>
        ) : (
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink sm:aspect-video">{stageHud}</div>
        )}

        <aside className="panel p-4 sm:p-5">
          {lot ? (
            <>
              <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
                {bidding ? "Now" : "Last piece"}
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight break-anywhere">{lot.title}</h2>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="font-sans text-4xl leading-none font-extrabold tabular-nums">
                  {money(lot.high_cents ?? lot.start_cents)}
                </p>
                {bidding && (
                  <Countdown endsAt={lot.ends_at} compact className="shrink-0 font-sans text-xl font-bold" />
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {bidding ? (lot.high_cents == null ? "Starting bid" : `Next bid ${money(minimum)}`) : (outcome ?? "Closed")}
              </p>
              {bidding && (
                <p className="mt-1 text-xs text-ink-faint">A bid in the last 20 seconds adds 20 seconds.</p>
              )}
              {crowd && (
                <div className="mt-4 border-t border-line pt-4">
                  <LotReactions
                    key={lot.auction_id}
                    auctionId={lot.auction_id}
                    likes={crowd.likes}
                    liked={crowd.liked}
                    notes={crowd.notes}
                    canWrite={Boolean(bidder) && bidding}
                    guest={false}
                    composer={false}
                    loginHref={`/login?next=/live/${show.id}`}
                  />
                </div>
              )}
              {bidding && !hosting && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 border-t border-line bg-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0">
                  <div className="flex items-center justify-between gap-3 sm:hidden">
                    <p className="min-w-0 truncate text-sm font-semibold">{lot.title}</p>
                    <Countdown endsAt={lot.ends_at} compact className="shrink-0 font-sans text-base font-bold" />
                  </div>
                  <LiveCommentBar
                    auctionId={bidder ? lot.auction_id : null}
                    loginHref={`/login?next=/live/${show.id}`}
                  />
                  {bidder ? (
                    <LiveBid
                      key={`${lot.auction_id}-${minimum}`}
                      auctionId={lot.auction_id}
                      minimum={minimum}
                      bidderName={bidder.name}
                      bidderEmail={bidder.email}
                    />
                  ) : (
                    <Link href={`/login?next=/live/${show.id}`} className="btn btn-ink w-full">
                      Sign in to bid {money(minimum)}
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-soft">The shop is live. The next piece, its price, and the bid button show up here.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
