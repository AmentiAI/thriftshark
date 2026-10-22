"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { enterWeeklyGiveaway, type FormState } from "@/lib/actions";
import type { WeeklyGiveaway } from "@/lib/types";

function weekEndMs(weekStart: string) {
  const day = weekStart.includes("T") ? weekStart : `${weekStart.slice(0, 10)}T00:00:00.000Z`;
  return new Date(day).getTime() + 7 * 24 * 60 * 60 * 1000;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/** This week's giveaway: prize, countdown, and the one step to get in. */
export function GiveawayCard({
  giveaway,
  alreadyEntered,
  account,
  buyerVerified,
}: {
  giveaway: WeeklyGiveaway;
  alreadyEntered: boolean;
  account: "guest" | "shop" | "buyer";
  buyerVerified: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(enterWeeklyGiveaway, null);
  const entered = alreadyEntered || Boolean(state?.ok);
  const openWeek = giveaway.status === "open";
  const drawn = giveaway.status === "drawn";
  const count = giveaway.entry_count + (entered && !alreadyEntered ? 1 : 0);
  const endsAt = weekEndMs(String(giveaway.week_start));
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now === null ? null : endsAt - now;
  const clock = left === null ? null : parts(left);
  const winner = drawn ? (giveaway.winner_shop_name ?? giveaway.winner_buyer_name) : null;

  return (
    <div className="panel overflow-hidden">
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:p-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-gold uppercase">
            <span aria-hidden className="h-2 w-2 rounded-full bg-gold" />
            {giveaway.title}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight break-anywhere sm:text-2xl">
            {giveaway.prize_text}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Free to enter. One winner is drawn when the week ends.{" "}
            <span className="tabular-nums">
              {count} {count === 1 ? "entry" : "entries"} so far.
            </span>
          </p>

          {openWeek && (
            <div className="mt-4 flex gap-2" aria-label="Time left to enter">
              {(
                [
                  ["d", "days"],
                  ["h", "hrs"],
                  ["m", "min"],
                  ["s", "sec"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="w-14 rounded-xl bg-paper-dim px-2 py-2 text-center">
                  <p className="font-sans text-lg leading-none font-bold tabular-nums">
                    {clock ? String(clock[key]).padStart(2, "0") : "--"}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:w-56">
          {drawn ? (
            <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm">
              Winner:{" "}
              {giveaway.winner_handle ? (
                <Link href={`/shop/${giveaway.winner_handle}`} className="font-semibold underline break-anywhere">
                  {winner ?? `@${giveaway.winner_handle}`}
                </Link>
              ) : (
                <span className="font-semibold break-anywhere">{winner ?? "drawn"}</span>
              )}
            </p>
          ) : !openWeek || (left !== null && left <= 0) ? (
            <p className="rounded-xl bg-paper-dim px-4 py-3 text-sm text-ink-soft">
              Entries are closed. The winner is announced here.
            </p>
          ) : entered ? (
            <p className="rounded-xl bg-kelp/10 px-4 py-3 text-center text-sm font-semibold text-kelp">
              You&apos;re in this week&apos;s draw
            </p>
          ) : account === "guest" ? (
            <div className="grid gap-2">
              <Link href="/signup" className="btn btn-ink w-full">
                Sign up to enter
              </Link>
              <Link href="/login" className="btn btn-ghost w-full">
                Log in
              </Link>
            </div>
          ) : account === "buyer" && !buyerVerified ? (
            <div>
              <Link href="/account" className="btn btn-ink w-full">
                Get Verified to enter
              </Link>
              <p className="mt-2 text-xs text-ink-soft">
                Verified buyers are entered every week automatically.
              </p>
            </div>
          ) : (
            <form action={action}>
              <button disabled={pending} className="btn btn-ink w-full">
                {pending ? "Entering…" : "Enter the giveaway"}
              </button>
            </form>
          )}
          {state?.error && <p className="mt-2 text-sm text-coral">{state.error}</p>}
        </div>
      </div>
    </div>
  );
}
