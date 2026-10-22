"use client";

import { useEffect, useRef } from "react";
import type { LotNote } from "@/lib/live-shows";

/** The chat box on a live show. Bids on the current piece appear in the same list. */
export function ShowChat({ notes, tall = false }: { notes: LotNote[]; tall?: boolean }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [notes]);

  return (
    <div>
      <p className="text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">Chat</p>
      {notes.length === 0 ? (
        <p className="mt-2 min-h-28 text-sm text-ink-soft">Say something. Bids show up here too.</p>
      ) : (
        <ul
          ref={listRef}
          className={`mt-2 space-y-2 overflow-y-auto pr-1 ${
            tall ? "max-h-[46vh] min-h-36" : "max-h-[40vh] min-h-28"
          }`}
        >
          {notes.map((note) => (
            <li key={note.key} className="text-base break-anywhere">
              <span className="font-semibold">{note.author_name}</span>{" "}
              <span className={note.kind === "bid" ? "font-bold text-gold" : "text-ink-soft"}>{note.body}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
