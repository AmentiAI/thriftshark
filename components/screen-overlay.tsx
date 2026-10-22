import type { ScreenSpot, ScreenStyle } from "@/lib/live-shows";

const SPOT: Record<ScreenSpot, string> = {
  top: "top-[16%]",
  middle: "top-[32%]",
  low: "top-[46%]",
};

/** Host text over the camera. Pointer events pass through to the video. */
export function ScreenOverlay({
  text,
  style,
  spot,
}: {
  text: string | null;
  style: ScreenStyle;
  spot: ScreenSpot;
}) {
  if (!text) return null;

  return (
    <div className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4 ${SPOT[spot]}`}>
      {style === "banner" && (
        <p className="w-full rounded-xl bg-coral px-4 py-2.5 text-center text-base font-extrabold tracking-wide break-anywhere text-white uppercase shadow-lg sm:text-lg">
          {text}
        </p>
      )}
      {style === "headline" && (
        <p className="max-w-full text-center font-display text-3xl leading-tight font-extrabold break-anywhere text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-4xl">
          {text}
        </p>
      )}
      {style === "sticker" && (
        <p className="max-w-[85%] -rotate-3 rounded-2xl border-2 border-white bg-gold px-4 py-2 text-center text-lg font-extrabold break-anywhere text-white shadow-lg">
          {text}
        </p>
      )}
    </div>
  );
}

/** The host's pinned note, above the chat lines. */
export function PinnedNote({ text, dark = true }: { text: string | null; dark?: boolean }) {
  if (!text) return null;
  return (
    <p
      className={
        dark
          ? "w-full rounded-xl bg-white/90 px-3 py-1.5 text-sm leading-snug break-anywhere text-ink"
          : "rounded-xl border border-line bg-paper px-3 py-2 text-sm leading-snug break-anywhere"
      }
    >
      <span className="mr-1.5 text-[10px] font-bold tracking-[0.14em] text-coral uppercase">Pinned</span>
      {text}
    </p>
  );
}
