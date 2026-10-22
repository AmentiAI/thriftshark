import { messageAuctionWinner } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import type { AuctionWin } from "@/lib/queries";

/** Sold pieces, with a way for the host to message whoever won. */
export function WinnerList({ wins }: { wins: AuctionWin[] }) {
  if (wins.length === 0) return null;

  return (
    <section>
      <h3 className="font-display text-xl font-bold">Winners</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Everyone who won a piece. Message them here about shipping.
      </p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {wins.map((win) => (
          <li key={win.auction_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-semibold break-anywhere">{win.title}</p>
              <p className="text-sm break-anywhere text-ink-soft">
                {win.winner_name} · {win.winner_email} · {money(win.amount_cents)}
                {win.show_title ? ` · ${win.show_title}` : ""}
              </p>
              {win.settled_at && <p className="text-xs text-ink-faint">{shortDate(win.settled_at)}</p>}
            </div>
            <form action={messageAuctionWinner} className="shrink-0">
              <input type="hidden" name="auction_id" value={win.auction_id} />
              <button className="btn btn-ink !px-3.5 !py-2 text-sm">Message</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
