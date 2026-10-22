import { Countdown } from "@/components/countdown";
import { PinnedNote } from "@/components/screen-overlay";
import type { LotNote } from "@/lib/live-shows";

/** Compact auction card on the bottom left of the camera. */
export function LiveHud({
  title,
  amount,
  endsAt,
  outcome,
  notes,
  pinned = null,
  lifted = false,
}: {
  title: string | null;
  amount: string | null;
  endsAt: string | null;
  outcome: string | null;
  notes: Pick<LotNote, "key" | "kind" | "author_name" | "body">[];
  pinned?: string | null;
  /** Keep the stream above the phone comment and bid bar. */
  lifted?: boolean;
}) {
  const recent = notes.slice(-5);

  return (
    <div
      className={`pointer-events-none absolute left-3 z-20 flex max-h-[72%] w-[min(18rem,78%)] flex-col justify-end gap-1 ${
        lifted ? "bottom-40 sm:bottom-3" : "bottom-3"
      }`}
    >
      <div className="shrink-0">
        <PinnedNote text={pinned} />
      </div>
      {recent.map((note) => (
        <p
          key={note.key}
          className="line-clamp-2 max-w-full rounded-xl bg-black/60 px-2.5 py-1 text-sm leading-snug break-anywhere text-white"
        >
          <span className="font-semibold">{note.author_name}</span>{" "}
          <span className={note.kind === "bid" ? "font-bold" : "text-white/85"}>{note.body}</span>
        </p>
      ))}
      <div className="w-full rounded-2xl bg-black/75 px-3 py-2.5 text-white">
        {title ? (
          <>
            <p className="truncate text-sm font-semibold">{title}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              {amount && (
                <p className="font-sans text-2xl leading-none font-extrabold tabular-nums">{amount}</p>
              )}
              {endsAt && <Countdown endsAt={endsAt} variant="overlay" />}
            </div>
            {!endsAt && outcome && <p className="mt-1 text-xs font-semibold">{outcome}</p>}
          </>
        ) : (
          <p className="text-sm font-semibold">Next piece coming up</p>
        )}
      </div>
    </div>
  );
}
