"use client";

import { Children } from "react";

/**
 * Seamless infinite scroller. The children are rendered twice and the track
 * slides exactly 50%, so the loop has no visible seam. Pauses on hover.
 */
export function Marquee({
  children,
  speed = 42,
  reverse = false,
  className = "",
  gap = "gap-5",
}: {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
  gap?: string;
}) {
  const items = Children.toArray(children);

  return (
    <div className={`marquee ${className}`}>
      <div
        className={`marquee-track ${reverse ? "marquee-track-reverse" : ""} ${gap}`}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className={`flex shrink-0 ${gap}`} aria-hidden={copy === 1}>
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
