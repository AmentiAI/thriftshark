"use client";

import { useActionState, useState } from "react";
import { setPinnedNote, setScreenText } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";
import type { ScreenSpot, ScreenStyle } from "@/lib/live-shows";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

const PRESETS = [
  "Free shipping tonight",
  "Starting at $1",
  "Next item up",
  "Last chance",
  "Be right back",
  "Thanks for watching",
];

const STYLES: [ScreenStyle, string][] = [
  ["banner", "Banner"],
  ["headline", "Big text"],
  ["sticker", "Sticker"],
];

const SPOTS: [ScreenSpot, string][] = [
  ["top", "Top"],
  ["middle", "Middle"],
  ["low", "Low"],
];

function Choice({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`tap rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
        on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Text over the camera and a pinned chat note, set from the studio. */
export function ScreenControls({
  showId,
  screenText,
  screenStyle,
  screenSpot,
  pinnedText,
}: {
  showId: number;
  screenText: string | null;
  screenStyle: ScreenStyle;
  screenSpot: ScreenSpot;
  pinnedText: string | null;
}) {
  const [textState, textAction, textPending] = useActionState<FormState, FormData>(setScreenText, null);
  const [pinState, pinAction, pinPending] = useActionState<FormState, FormData>(setPinnedNote, null);
  const [draft, setDraft] = useState(screenText ?? "");
  const [style, setStyle] = useState<ScreenStyle>(screenStyle);
  const [spot, setSpot] = useState<ScreenSpot>(screenSpot);
  const [pin, setPin] = useState(pinnedText ?? "");

  return (
    <div className="space-y-6">
      <form action={textAction} className="space-y-4">
        <input type="hidden" name="show_id" value={showId} />
        <input type="hidden" name="screen_style" value={style} />
        <input type="hidden" name="screen_spot" value={spot} />
        <label className="block">
          <span className={label}>Text on screen</span>
          <input
            name="screen_text"
            maxLength={80}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Free shipping tonight"
            className="field"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDraft(preset)}
              className="tap rounded-full bg-paper-dim px-3 py-1.5 text-sm text-ink-soft"
            >
              {preset}
            </button>
          ))}
        </div>
        <div>
          <span className={label}>Look</span>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(([value, name]) => (
              <Choice key={value} on={style === value} onClick={() => setStyle(value)}>
                {name}
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>Spot</span>
          <div className="flex flex-wrap gap-2">
            {SPOTS.map(([value, name]) => (
              <Choice key={value} on={spot === value} onClick={() => setSpot(value)}>
                {name}
              </Choice>
            ))}
          </div>
        </div>
        {textState?.error && <p className="text-sm text-coral">{textState.error}</p>}
        {textState?.ok && <p className="text-sm font-medium">{textState.ok}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            name="intent"
            value="show"
            disabled={textPending}
            className="btn btn-ink w-full sm:w-auto"
          >
            {textPending ? "Saving…" : "Show on screen"}
          </button>
          {screenText && (
            <button
              name="intent"
              value="clear"
              disabled={textPending}
              className="btn btn-ghost w-full sm:w-auto"
            >
              Take it off
            </button>
          )}
        </div>
      </form>

      <form action={pinAction} className="space-y-3 border-t border-line pt-5">
        <input type="hidden" name="show_id" value={showId} />
        <label className="block">
          <span className={label}>Pinned note</span>
          <input
            name="pinned_text"
            maxLength={140}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Ships in 2 days. Pay within 24 hours of winning."
            className="field"
          />
        </label>
        <p className="text-xs text-ink-faint">Sits above the chat for everyone watching.</p>
        {pinState?.error && <p className="text-sm text-coral">{pinState.error}</p>}
        {pinState?.ok && <p className="text-sm font-medium">{pinState.ok}</p>}
        <div className="flex flex-wrap gap-2">
          <button name="intent" value="pin" disabled={pinPending} className="btn btn-ink w-full sm:w-auto">
            {pinPending ? "Saving…" : "Pin"}
          </button>
          {pinnedText && (
            <button name="intent" value="clear" disabled={pinPending} className="btn btn-ghost w-full sm:w-auto">
              Unpin
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
