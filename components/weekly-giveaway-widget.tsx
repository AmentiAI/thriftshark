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
  alreadyEntered,
  account = "guest",
  buyerVerified = false,
}: {
  giveaway: WeeklyGiveaway;
  loggedIn?: boolean;
  alreadyEntered: boolean;
  account?: "guest" | "shop" | "buyer";
  buyerVerified?: boolean;
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
        Verified buyers are entered automatically · {weekLabel}
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
          ? "entry"
          : "entries"}
      </p>

      {drawn && (giveaway.winner_handle || giveaway.winner_buyer_name) ? (
        <p className="mt-5 rounded-2xl border border-reef/30 bg-reef/10 px-4 py-3 text-sm">
          Winner:{" "}
          {giveaway.winner_handle ? (
            <Link
              href={`/shop/${giveaway.winner_handle}`}
              className="font-semibold underline hover:text-reef-dark"
            >
              {giveaway.winner_shop_name ?? `@${giveaway.winner_handle}`}
            </Link>
          ) : (
            <span className="font-semibold">{giveaway.winner_buyer_name}</span>
          )}
        </p>
      ) : open ? (
        <div className="mt-5">
          {account === "guest" ? (
            <>
              <Link href="/signup" className="btn btn-ink w-full">
                Create an account
              </Link>
              <p className="mt-2 text-center text-xs text-ink-faint">
                Verified buyers are entered every week.{" "}
                <Link href="/login" className="font-semibold underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : account === "buyer" && !buyerVerified ? (
            <>
              <Link href="/account" className="btn btn-ink w-full">
                Get Verified — $10
              </Link>
              <p className="mt-2 text-center text-xs text-ink-faint">
                Green check, this week’s draw, and no platform fee.
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
