import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { HostStage } from "@/components/camera-relay";
import { Countdown } from "@/components/countdown";
import { LiveBid } from "@/components/live-bid";
import { LiveCommentBar } from "@/components/live-comment-bar";
import { LiveRefresh } from "@/components/live-refresh";
import { LiveViewer } from "@/components/live-viewer";
import { LockScroll } from "@/components/lock-scroll";
import { ShopAvatar } from "@/components/shop-avatar";
import { currentBuyer } from "@/lib/buyer-account";
import { money } from "@/lib/format";
import { beginLiveCardSetup, toggleLotLike } from "@/lib/live-actions";
import { getShow, lotCrowd, lotOutcome, showChat } from "@/lib/live-shows";
import { currentSeller } from "@/lib/seller-auth";
import { saveLiveCard } from "@/lib/stripe-billing";

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
  const params = await props.searchParams;
  const cardFlag = typeof params.card === "string" ? params.card : "";
  const showId = Number(id);
  if (!Number.isInteger(showId)) notFound();
  if (cardFlag.startsWith("cs_")) await saveLiveCard(cardFlag);
  const show = await getShow(showId);
  if (!show || show.status === "draft") notFound();

  const buyer = await currentBuyer();
  const seller = buyer ? null : await currentSeller();
  if (!buyer && !seller) redirect(`/login?next=/live/${showId}`);

  const lot = show.lots.find((item) => item.auction_id === show.current_auction_id) ?? null;
  const bidding = Boolean(lot && lot.auction_status === "live" && new Date(lot.ends_at).getTime() > Date.now());
  const crowd = lot
    ? await lotCrowd(lot.auction_id, { buyerId: buyer?.id ?? null, sellerId: seller?.id ?? null })
    : null;
  const chat = await showChat(show.id, lot?.auction_id ?? null);
  const recent = chat.slice(-6);
  const minimum = lot ? (lot.high_cents == null ? lot.start_cents : lot.high_cents + lot.increment_cents) : 0;
  const bidder = buyer
    ? { name: buyer.name, email: buyer.email }
    : seller
      ? { name: seller.shop_name, email: seller.email }
      : null;
  const hosting = seller?.id === show.seller_id;
  const hasCard = Boolean(buyer?.payment_method_id || seller?.payment_method_id);
  const outcome = lot && !bidding ? lotOutcome(lot) : null;
  const live = show.status === "live";
  const loginHref = `/login?next=/live/${show.id}`;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-black">
      <LockScroll />
      <LiveRefresh active={live} />
      <div className="relative h-full w-full max-w-[calc(100dvh*9/16)]">
        {hosting && live ? (
          <HostStage showId={show.id} />
        ) : live ? (
          <LiveViewer showId={show.id} active fill />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />

        <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/live"
              className="tap grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/50 text-lg text-white"
              aria-label="Leave live"
            >
              ×
            </Link>
            <ShopAvatar
              shopName={show.seller_shop_name}
              logoImageId={show.seller_logo_image_id}
              size={36}
              className="border-white/40"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{show.seller_shop_name}</p>
              {live ? (
                <p className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.14em] text-coral uppercase">
                  <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
                  Live
                </p>
              ) : (
                <p className="text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase">Ended</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {hosting && (
              <Link href={`/dashboard/shows/${show.id}`} className="tap rounded-full bg-black/50 px-3 text-xs font-semibold text-white">
                Studio
              </Link>
            )}
            {bidding && lot && crowd && (
              <form action={toggleLotLike}>
                <input type="hidden" name="auction_id" value={lot.auction_id} />
                <button
                  className={
                    crowd.liked
                      ? "tap rounded-full bg-coral px-3 text-sm font-bold text-white"
                      : "tap rounded-full bg-black/50 px-3 text-sm font-bold text-white"
                  }
                >
                  ♥ {crowd.likes}
                </button>
              </form>
            )}
          </div>
        </header>

        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mb-2 flex max-h-[34%] w-[min(18rem,86%)] flex-col justify-end gap-1 overflow-hidden">
            {recent.map((note) => (
              <p
                key={note.key}
                className="line-clamp-2 text-sm leading-snug break-anywhere text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              >
                <span className="font-semibold">{note.author_name}</span>{" "}
                <span className={note.kind === "bid" ? "font-bold text-gold" : "text-white/90"}>{note.body}</span>
              </p>
            ))}
          </div>

          <div className="mb-2 w-full rounded-2xl bg-black/55 px-3 py-2.5 text-white">
            {lot ? (
              <>
                <p className="truncate text-sm font-semibold">{lot.title}</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <p className="font-sans text-3xl leading-none font-extrabold tabular-nums">
                    {money(lot.high_cents ?? lot.start_cents)}
                  </p>
                  {bidding && <Countdown endsAt={lot.ends_at} variant="overlay" />}
                </div>
                <p className="mt-1 text-xs text-white/75">
                  {bidding
                    ? lot.high_cents == null
                      ? "Starting bid"
                      : `Next bid ${money(minimum)} · last 20 seconds adds 20 seconds`
                    : (outcome ?? "Closed")}
                  {!hosting && live && !hasCard ? " · a card is required to bid" : ""}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold">
                Next piece coming up
                {!hosting && live && !hasCard ? " · a card is required to bid" : ""}
              </p>
            )}
          </div>

          {live && !hosting && cardFlag === "error" && (
            <p className="mb-2 text-right text-xs font-semibold text-coral">Card setup did not start. Try the bid button again.</p>
          )}
          {live && (
            <div className="flex items-end gap-2">
              <LiveCommentBar showId={show.id} loginHref={loginHref} overlay />
              {!hosting && bidding && lot && bidder && hasCard && (
                <LiveBid
                  key={`${lot.auction_id}-${minimum}`}
                  auctionId={lot.auction_id}
                  minimum={minimum}
                  bidderName={bidder.name}
                  bidderEmail={bidder.email}
                  overlay
                />
              )}
              {!hosting && hasCard && !(bidding && lot && bidder) && (
                <button type="button" disabled className="btn shrink-0 bg-coral text-white opacity-70">
                  Bid
                </button>
              )}
              {!hosting && !hasCard && (
                <form action={beginLiveCardSetup}>
                  <input type="hidden" name="show_id" value={show.id} />
                  <button className="btn shrink-0 bg-coral text-white hover:opacity-90">
                    {bidding && lot ? `Bid ${money(minimum)}` : "Bid"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
