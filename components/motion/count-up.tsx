"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` the first time it is scrolled into view. */
export function CountUp({
  to,
  duration = 1400,
  prefix = "",
  suffix = "",
  className = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || done) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      // Skip the count and land on the final figure next tick.
      const id = window.setTimeout(() => {
        setValue(to);
        setDone(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      setDone(true);

      const start = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // easeOutExpo, so the number lands rather than crawls.
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(Math.round(to * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [to, duration, done]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
