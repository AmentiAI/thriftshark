"use client";

import { useEffect, useState } from "react";

/**
 * Drops a headline in word by word on mount. Each word gets its own mask, so
 * the letters slide up from behind a clean edge.
 */
export function StaggerWords({
  text,
  className = "",
  wordClassName = "",
  delay = 120,
  step = 70,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  step?: number;
}) {
  const [ready, setReady] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 30);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span
            className={`inline-block transition-all duration-[760ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
              ready ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            } ${wordClassName}`}
            style={{ transitionDelay: `${delay + i * step}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
