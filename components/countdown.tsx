"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  surface = "ink",
  variant = "default",
}: {
  endsAt: string;
  className?: string;
  compact?: boolean;
  /** `glass` is for clocks sitting on a dark panel. */
  surface?: "ink" | "glass";
  /** `live` is the big show clock. `overlay` is the same clock on the camera, bottom left. */
  variant?: "default" | "live" | "overlay";
}) {
  const router = useRouter();
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    let refreshId = 0;
    const tick = () => {
      const left = target - Date.now();
      setRemaining(left);
      if (left <= 0 && !refreshId) {
        // Give the server a beat to pass the end time, then let it settle the lot.
        refreshId = window.setTimeout(() => router.refresh(), 800);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => {
      window.clearInterval(id);
      if (refreshId) window.clearTimeout(refreshId);
    };
  }, [target, router]);

  if (variant === "live" || variant === "overlay") {
    const total = Math.max(0, Math.ceil(remaining / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const urgent = total <= 20;
    const size = variant === "overlay" ? "text-2xl" : "text-5xl";
    const color = urgent ? "text-coral" : variant === "overlay" ? "text-white" : "text-ink";
    return (
      <p className={`font-sans ${size} leading-none font-extrabold tabular-nums ${color} ${className}`}>
        {minutes}:{String(seconds).padStart(2, "0")}
      </p>
    );
  }

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
          className={`min-w-14 rounded-xl px-3 py-2 text-center ${
            urgent
              ? "bg-coral text-white"
              : surface === "glass"
                ? "bg-white/15 text-white"
                : "bg-paper-dim text-ink"
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
