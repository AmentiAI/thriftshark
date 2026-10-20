"use client";

import { Children, cloneElement, isValidElement } from "react";

/**
 * Seamless infinite scroller. Children are padded so a short set still fills
 * the track, then rendered twice; the track slides exactly 50% so the loop
 * has no visible seam. Pauses on hover.
 */
export function Marquee({
  children,
  speed = 42,
  reverse = false,
  className = "",
  gap = "gap-5",
  minItems = 8,
}: {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
  gap?: string;
  /** Pad short lists so the loop stays wide enough to look continuous. */
  minItems?: number;
}) {
  const items = Children.toArray(children);
  const sequence = padSequence(items, minItems);

  return (
    <div className={`marquee ${className}`}>
      <div
        className={`marquee-track ${reverse ? "marquee-track-reverse" : ""} ${gap}`}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className={`flex shrink-0 ${gap}`} aria-hidden={copy === 1}>
            {sequence.map((node, i) =>
              isValidElement(node)
                ? cloneElement(node, { key: `${copy}-${i}` })
                : node,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function padSequence(items: React.ReactNode[], minItems: number) {
  if (items.length === 0) return [] as React.ReactNode[];
  const target = Math.max(minItems, items.length);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < target; i++) {
    out.push(items[i % items.length]);
  }
  return out;
}
