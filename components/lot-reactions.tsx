"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { postLotComment, toggleLotLike } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";
import type { LotNote } from "@/lib/live-shows";

export function LotReactions({
  auctionId,
  likes,
  liked,
  notes,
  canWrite,
  guest,
  loginHref,
  host = false,
  composer = true,
}: {
  auctionId: number;
  likes: number;
  liked: boolean;
  notes: LotNote[];
  canWrite: boolean;
  guest: boolean;
  loginHref: string;
  /** Taller stream the host can read while the phone is in their hand. */
  host?: boolean;
  /** Viewers type in the bar on the stream, so the list can skip its own box. */
  composer?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(postLotComment, null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [notes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">
          {host ? "Comments" : "Chat"}
        </p>
        {canWrite ? (
          <form action={toggleLotLike}>
            <input type="hidden" name="auction_id" value={auctionId} />
            <button className={liked ? "tap text-sm font-semibold text-coral" : "tap text-sm font-semibold text-ink-soft"}>
              {liked ? "Liked" : "Like"} · {likes}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-faint">Likes · {likes}</p>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-ink-soft">Comments and bids show up here.</p>
      ) : (
        <ul
          ref={listRef}
          className={
            host
              ? "max-h-[46vh] min-h-36 space-y-2 overflow-y-auto pr-1"
              : "max-h-[40vh] min-h-24 space-y-2 overflow-y-auto pr-1"
          }
        >
          {notes.map((note) => (
            <li key={note.key} className="text-base break-anywhere">
              <span className="font-semibold">{note.author_name}</span>{" "}
              <span className={note.kind === "bid" ? "font-bold text-gold" : "text-ink-soft"}>{note.body}</span>
            </li>
          ))}
        </ul>
      )}

      {composer && canWrite ? (
        <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input type="hidden" name="auction_id" value={auctionId} />
          <input
            name="body"
            required
            maxLength={280}
            className="field min-w-0 sm:flex-1"
            placeholder="Say something"
          />
          <button disabled={pending} className="btn btn-ink w-full sm:w-auto">
            {pending ? "…" : "Send"}
          </button>
          {state?.error && <p className="basis-full text-sm text-coral">{state.error}</p>}
        </form>
      ) : composer && guest ? (
        <Link href={loginHref} className="text-sm font-semibold underline">
          Sign in to bid and chat
        </Link>
      ) : null}
    </div>
  );
}
