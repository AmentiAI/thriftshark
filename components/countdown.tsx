"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Ticks down to `endsAt`, then refreshes the route once so the server can
 * settle the auction and render the result.
 */
export function Countdown({
  endsAt,
  className = "",
  compact = false,
}: {
  endsAt: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());
  const refreshed = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (remaining > 0 || refreshed.current) return;
    refreshed.current = true;
    // Give the server a beat to pass the end time, then let it settle the lot.
    const id = window.setTimeout(() => router.refresh(), 1200);
    return () => window.clearTimeout(id);
  }, [remaining, router]);

  if (remaining <= 0) {
    return <span className={className}>Closing…</span>;
  }

  const { days, hours, minutes, seconds } = parts(remaining);
  const urgent = remaining < 60 * 60 * 1000;

  if (compact) {
    const text =
      days > 0
        ? `${days}d ${hours}h`
        : hours > 0
          ? `${hours}h ${minutes}m`
          : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    return (
      <span className={`${className} ${urgent ? "text-coral" : ""} tabular-nums`}>{text}</span>
    );
  }

  const cells = [
    [days, "days"],
    [hours, "hrs"],
    [minutes, "min"],
    [seconds, "sec"],
  ] as [number, string][];

  return (
    <div className={`flex gap-2 ${className}`}>
      {cells.map(([value, label]) => (
        <div
          key={label}
          className={`min-w-14 rounded-2xl px-3 py-2 text-center ${
            urgent ? "bg-coral text-white" : "bg-ink text-paper"
          }`}
        >
          <p className="font-display text-2xl leading-none font-extrabold tabular-nums">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
