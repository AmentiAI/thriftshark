"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enterWeeklyGiveaway, type FormState } from "@/lib/actions";
import type { WeeklyGiveaway } from "@/lib/types";

function formatWeekLabel(weekStart: string) {
  const start = new Date(
    weekStart.includes("T") ? weekStart : `${weekStart}T00:00:00.000Z`,
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function WeeklyGiveawayWidget({
  giveaway,
  loggedIn,
  alreadyEntered,
}: {
  giveaway: WeeklyGiveaway;
  loggedIn: boolean;
  alreadyEntered: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    enterWeeklyGiveaway,
    null,
  );
  const weekLabel = formatWeekLabel(String(giveaway.week_start));
  const entered = alreadyEntered || Boolean(state?.ok);
  const open = giveaway.status === "open";
  const drawn = giveaway.status === "drawn";

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">
          {giveaway.title}
        </h3>
        <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
          Weekly
        </p>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        One entry per shop · {weekLabel}. Resets each Monday.
      </p>

      <div className="mt-5 rounded-2xl bg-paper-dim px-4 py-3">
        <p className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">
          This week&apos;s prize
        </p>
        <p className="mt-1 font-display text-base font-bold tracking-tight text-ink">
          {giveaway.prize_text}
        </p>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        <span className="font-semibold text-ink tabular-nums">
          {giveaway.entry_count + (entered && !alreadyEntered ? 1 : 0)}
        </span>{" "}
        {giveaway.entry_count + (entered && !alreadyEntered ? 1 : 0) === 1
          ? "shop entered"
          : "shops entered"}
      </p>

      {drawn && giveaway.winner_handle ? (
        <p className="mt-5 rounded-2xl border border-reef/30 bg-reef/10 px-4 py-3 text-sm">
          Winner:{" "}
          <Link
            href={`/shop/${giveaway.winner_handle}`}
            className="font-semibold underline hover:text-reef-dark"
          >
            {giveaway.winner_shop_name ?? `@${giveaway.winner_handle}`}
          </Link>
        </p>
      ) : open ? (
        <div className="mt-5">
          {!loggedIn ? (
            <>
              <Link href="/login" className="btn btn-ink w-full">
                Sign in to enter
              </Link>
              <p className="mt-2 text-center text-xs text-ink-faint">
                Shop accounts only.{" "}
                <Link href="/signup" className="font-semibold underline">
                  Open a shop
                </Link>
              </p>
            </>
          ) : entered ? (
            <p className="rounded-2xl bg-kelp/10 px-4 py-3 text-center text-sm font-semibold text-ink">
              You&apos;re in this week&apos;s draw
            </p>
          ) : (
            <form action={action}>
              <button disabled={pending} className="btn btn-ink w-full">
                {pending ? "Entering…" : "Enter this week"}
              </button>
            </form>
          )}
          {state?.error && (
            <p className="mt-3 rounded-2xl bg-coral/10 px-3 py-2 text-xs text-ink">
              {state.error}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink-soft">
          Entries are closed for this week.
        </p>
      )}
    </div>
  );
}
