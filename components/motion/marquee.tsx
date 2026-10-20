"use client";

import { Children, cloneElement, isValidElement } from "react";

/**
 * Seamless infinite scroller. Children are padded, then laid out twice in one
 * flex row with uniform gaps. The track slides exactly 50%, so the loop has
 * no visible seam and never hard-resets.
 */
export function Marquee({
  children,
  speed = 42,
  reverse = false,
  className = "",
  gap = "gap-5",
  minItems = 8,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
  gap?: string;
  /** Pad short lists so the loop stays wide enough to look continuous. */
  minItems?: number;
  /** Shops rail sets false so motion never stops. */
  pauseOnHover?: boolean;
}) {
  const items = Children.toArray(children);
  const sequence = padSequence(items, minItems);

  return (
    <div
      className={`marquee ${pauseOnHover ? "marquee-pause-hover" : ""} ${className}`}
    >
      <div
        className={`marquee-track ${gap} ${reverse ? "marquee-track-reverse" : ""}`}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {[0, 1].flatMap((copy) =>
          sequence.map((node, i) => {
            const key = `${copy}-${i}`;
            if (isValidElement(node)) {
              return cloneElement(node, {
                key,
                "aria-hidden": copy === 1 ? true : undefined,
              } as Record<string, unknown>);
            }
            return (
              <span key={key} aria-hidden={copy === 1 || undefined}>
                {node}
              </span>
            );
          }),
        )}
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
