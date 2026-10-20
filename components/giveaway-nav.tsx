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

function pillLeft(ms: number) {
  const { d, h, m } = parts(ms);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function GiveawayNav({
  giveaway,
  alreadyEntered,
  account,
  buyerVerified,
  open,
  onToggle,
}: {
  giveaway: WeeklyGiveaway;
  alreadyEntered: boolean;
  account: "guest" | "shop" | "buyer";
  buyerVerified: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    enterWeeklyGiveaway,
    null,
  );
  const entered = alreadyEntered || Boolean(state?.ok);
  const openWeek = giveaway.status === "open";
  const drawn = giveaway.status === "drawn";
  const count = giveaway.entry_count + (entered && !alreadyEntered ? 1 : 0);
  const endsAt = weekEndMs(String(giveaway.week_start));
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : endsAt - now;
  const clock = left === null ? null : parts(left);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="tap inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1.5 text-xs font-bold text-paper"
      >
        <span className="sm:hidden">Win</span>
        <span className="hidden sm:inline">Giveaway</span>
        {left !== null && left > 0 && (
          <span className="font-sans font-semibold tracking-normal tabular-nums">{pillLeft(left)}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-3 z-50 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-paper p-3 text-ink shadow-lg">
          <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
            {giveaway.title}
          </p>
          <p className="mt-1 font-display text-sm font-bold tracking-tight">
            {giveaway.prize_text}
          </p>
          {clock && (
            <p className="mt-2 font-sans text-sm font-semibold tracking-normal text-ink tabular-nums">
              {left !== null && left <= 0
                ? "Ended"
                : `${clock.d}d ${String(clock.h).padStart(2, "0")}h ${String(clock.m).padStart(2, "0")}m ${String(clock.s).padStart(2, "0")}s`}
            </p>
          )}
          <p className="mt-1 text-xs text-ink-soft">
            {count} {count === 1 ? "entry" : "entries"}
          </p>

          {drawn && (giveaway.winner_handle || giveaway.winner_buyer_name) ? (
            <p className="mt-2 text-xs">
              Winner:{" "}
              {giveaway.winner_handle ? (
                <Link href={`/shop/${giveaway.winner_handle}`} className="font-semibold underline">
                  {giveaway.winner_shop_name ?? `@${giveaway.winner_handle}`}
                </Link>
              ) : (
                <span className="font-semibold">{giveaway.winner_buyer_name}</span>
              )}
            </p>
          ) : openWeek ? (
            <div className="mt-2">
              {account === "guest" ? (
                <Link href="/signup" className="btn btn-ink w-full !px-3 !py-2 text-xs">
                  Create an account
                </Link>
              ) : account === "buyer" && !buyerVerified ? (
                <Link href="/account" className="btn btn-ink w-full !px-3 !py-2 text-xs">
                  Get Verified — $10
                </Link>
              ) : entered ? (
                <p className="rounded-xl bg-kelp/10 px-2 py-2 text-center text-xs font-semibold">
                  You&apos;re in
                </p>
              ) : (
                <form action={action}>
                  <button disabled={pending} className="btn btn-ink w-full !px-3 !py-2 text-xs">
                    {pending ? "Entering…" : "Enter"}
                  </button>
                </form>
              )}
              {state?.error && <p className="mt-2 text-xs text-coral">{state.error}</p>}
            </div>
          ) : (
            <p className="mt-2 text-xs text-ink-soft">Entries are closed.</p>
          )}
        </div>
      )}
    </>
  );
}
