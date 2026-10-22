import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveCommentBar } from "@/components/live-comment-bar";
import { LiveHud } from "@/components/live-hud";
import { ShowChat } from "@/components/show-chat";
import { DestinationForm, OpenLotForm, SendOutForm } from "@/components/show-forms";
import { LiveRefresh } from "@/components/live-refresh";
import { LiveStudio } from "@/components/live-studio";
import { ScreenControls } from "@/components/screen-controls";
import { ScreenOverlay } from "@/components/screen-overlay";
import { messageAuctionWinner } from "@/lib/actions";
import {
  closeShowLot,
  deleteLiveDestination,
  endLiveShow,
} from "@/lib/live-actions";
import { getShow, lotOutcome, sellerDestinations, showChat, showOutputs, viewerCount } from "@/lib/live-shows";
import { ViewerCount } from "@/components/viewer-count";
import { livekitConfigured } from "@/lib/livekit";
import { money } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export default async function ShowStudioPage(props: PageProps<"/dashboard/shows/[id]">) {
  const seller = await requireSeller();
  const { id } = await props.params;
  const showId = Number(id);
  if (!Number.isInteger(showId)) notFound();
  const show = await getShow(showId);
  if (!show || show.seller_id !== seller.id) notFound();

  const [destinations, outputs, watching] = await Promise.all([
    sellerDestinations(seller.id),
    showOutputs(show.id),
    viewerCount(show.id),
  ]);
  const onStage = show.lots.find((lot) => lot.auction_id === show.current_auction_id) ?? null;
  const waiting = Boolean(
    onStage && onStage.auction_status === "live" && new Date(onStage.ends_at).getTime() > Date.now(),
  );
  const chat = show.status === "live" ? await showChat(show.id, onStage?.auction_id ?? null) : [];
  const outcome = onStage && !waiting ? lotOutcome(onStage) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">{show.status}</p>
            {show.status === "live" && <ViewerCount count={watching} dark={false} />}
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight break-anywhere sm:text-3xl">{show.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {show.status !== "draft" && (
            <Link href={`/live/${show.id}`} className="btn btn-ghost !px-3.5 !py-2 text-sm">
              Buyer page
            </Link>
          )}
          {show.status === "live" && (
            <form action={endLiveShow}>
              <input type="hidden" name="show_id" value={show.id} />
              <button className="btn btn-ghost !px-3.5 !py-2 text-sm">End show</button>
            </form>
          )}
        </div>
      </header>

      <LiveRefresh active={show.status === "live"} />
      <LiveStudio
        showId={show.id}
        live={show.status === "live"}
        videoReady={livekitConfigured()}
        hud={
          <>
            {show.status === "live" && (
              <span className="pointer-events-none absolute top-3 right-3 z-20">
                <ViewerCount count={watching} />
              </span>
            )}
            <ScreenOverlay text={show.screen_text} style={show.screen_style} spot={show.screen_spot} />
            <LiveHud
              title={onStage?.title ?? null}
              amount={onStage ? money(onStage.high_cents ?? onStage.start_cents) : null}
              endsAt={waiting && onStage ? onStage.ends_at : null}
              outcome={outcome}
              notes={chat}
              pinned={show.pinned_text}
            />
          </>
        }
        stream={
          show.status === "live" ? (
            <section className="panel p-3 sm:p-4">
              <ShowChat notes={chat} tall />
              <div className="mt-3">
                <LiveCommentBar showId={show.id} loginHref={`/login?next=/live/${show.id}`} />
              </div>
              {waiting && (
                <form action={closeShowLot} className="mt-3">
                  <input type="hidden" name="show_id" value={show.id} />
                  <button className="tap text-sm font-semibold text-ink-faint underline">Close this item</button>
                </form>
              )}
            </section>
          ) : null
        }
      />

      {show.status === "live" && (
        <details className="panel p-4" open>
          <summary className="tap cursor-pointer font-display text-xl font-bold">On screen</summary>
          <p className="mt-1 text-sm text-ink-soft">Viewers see this over your camera within a couple of seconds.</p>
          <div className="mt-4">
            <ScreenControls
              showId={show.id}
              screenText={show.screen_text}
              screenStyle={show.screen_style}
              screenSpot={show.screen_spot}
              pinnedText={show.pinned_text}
            />
          </div>
        </details>
      )}

      {show.status === "live" && !waiting && (
        <section className="panel p-4">
          {outcome && <p className="mb-4 text-sm font-semibold">{outcome}</p>}
          <h3 className="font-display text-xl font-bold">Next item</h3>
          <div className="mt-4">
            <OpenLotForm showId={show.id} />
          </div>
        </section>
      )}

      {show.lots.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold">This show</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {show.lots.map((lot) => (
              <li key={lot.auction_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {lot.title}
                    {lot.auction_id === show.current_auction_id ? (waiting ? " · on stage" : " · last") : ""}
                  </p>
                  <p className="text-xs break-anywhere text-ink-faint">
                    {lot.auction_status === "sold" && lot.winner_name
                      ? `Sold to ${lot.winner_name}${lot.winner_email ? ` · ${lot.winner_email}` : ""} · ${money(lot.high_cents ?? lot.start_cents)}`
                      : `${lot.auction_status} · ${money(lot.high_cents ?? lot.start_cents)} · ${lot.bid_count} bids`}
                  </p>
                </div>
                {lot.auction_status === "sold" && (
                  <form action={messageAuctionWinner} className="shrink-0">
                    <input type="hidden" name="auction_id" value={lot.auction_id} />
                    <button className="btn btn-ink !px-3.5 !py-2 text-sm">Message</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="panel p-4">
        <summary className="tap cursor-pointer font-semibold">YouTube and Instagram</summary>
        <p className="mt-3 text-sm text-ink-soft">Optional. The show is already live here.</p>
        {show.status === "live" && destinations.length > 0 && (
          <div className="mt-4">
            <SendOutForm showId={show.id} />
          </div>
        )}
        {destinations.length > 0 && (
          <ul className="mt-4 space-y-2">
            {destinations.map((destination) => {
              const output = outputs.find((row) => row.destination_id === destination.id);
              return (
                <li key={destination.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 break-anywhere">
                    <span className="font-semibold uppercase">{destination.platform}</span>
                    {destination.label ? ` · ${destination.label}` : ""} · key saved
                    {output ? ` · ${output.status}` : ""}
                    {output?.error_message ? ` · ${output.error_message}` : ""}
                  </span>
                  <form action={deleteLiveDestination}>
                    <input type="hidden" name="id" value={destination.id} />
                    <button className="text-sm font-semibold text-ink-faint underline">Remove</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-5">
          <DestinationForm />
        </div>
      </details>
    </div>
  );
}
