"use client";

import { useEffect, useState } from "react";

function formatLeft(ms: number) {
  if (ms <= 0) return "Live now — refresh";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Countdown until a scheduled piece hits the rack. Plus Jakarta Sans, not the display face. */
export function DropClock({ at, prefix = "Drops in" }: { at: string; prefix?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(formatLeft(new Date(at).getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [at]);

  return (
    <p className="font-sans text-sm font-semibold tracking-normal text-ink tabular-nums">
      {prefix} {label ?? "—"}
    </p>
  );
}
