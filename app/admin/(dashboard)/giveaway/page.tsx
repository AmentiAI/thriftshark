import Link from "next/link";
import {
  drawGiveawayWinner,
  updateGiveawayPrize,
} from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { ensureCurrentGiveaway, listGiveaways } from "@/lib/giveaways";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminGiveawayPage() {
  await requireAdmin();
  const current = await ensureCurrentGiveaway();
  const history = await listGiveaways(8);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Weekly giveaway
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Shop accounts enter once per Mon–Sun UTC week from the homepage. Set
          the prize, then draw a winner when you&apos;re ready.
        </p>
      </header>

      <section className="panel p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold tracking-tight">
            This week
          </h3>
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {current.status} · {current.entry_count}{" "}
            {current.entry_count === 1 ? "entry" : "entries"}
          </p>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Week of {String(current.week_start).slice(0, 10)}
        </p>

        <form action={updateGiveawayPrize} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={current.id} />
          <div>
            <label
              className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase"
              htmlFor="title"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={current.title}
              className="field"
              maxLength={80}
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase"
              htmlFor="prize_text"
            >
              Prize
            </label>
            <textarea
              id="prize_text"
              name="prize_text"
              required
              rows={3}
              defaultValue={current.prize_text}
              className="field"
              maxLength={240}
            />
          </div>
          <button className="btn btn-ink">Save prize</button>
        </form>

        {current.status !== "drawn" && (
          <form action={drawGiveawayWinner} className="mt-6 border-t border-line pt-6">
            <input type="hidden" name="id" value={current.id} />
            <p className="text-sm text-ink-soft">
              Picks one entered shop at random. You can still edit the prize
              after drawing.
            </p>
            <button
              disabled={current.entry_count === 0}
              className="btn btn-lime mt-4 disabled:opacity-50"
            >
              {current.entry_count === 0
                ? "No entries yet"
                : `Draw winner (${current.entry_count})`}
            </button>
          </form>
        )}

        {current.status === "drawn" && current.winner_handle && (
          <p className="mt-6 rounded-2xl bg-reef/10 px-4 py-3 text-sm">
            Winner:{" "}
            <Link
              href={`/shop/${current.winner_handle}`}
              className="font-semibold underline"
            >
              {current.winner_shop_name ?? `@${current.winner_handle}`}
            </Link>
            {current.drawn_at && (
              <span className="text-ink-faint">
                {" "}
                · drawn {shortDate(current.drawn_at)}
              </span>
            )}
          </p>
        )}
      </section>

      <section>
        <h3 className="font-display text-lg font-extrabold tracking-tight">
          Recent weeks
        </h3>
        <ul className="mt-4 space-y-2">
          {history.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper-dim px-4 py-3 text-sm ring-1 ring-line"
            >
              <div className="min-w-0">
                <p className="font-semibold">{g.title}</p>
                <p className="truncate text-xs text-ink-faint">
                  {String(g.week_start).slice(0, 10)} · {g.prize_text}
                </p>
              </div>
              <div className="text-right text-xs text-ink-soft">
                <p className="font-bold uppercase">{g.status}</p>
                <p>
                  {g.entry_count} {g.entry_count === 1 ? "entry" : "entries"}
                  {g.winner_handle ? ` · @${g.winner_handle}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
