"use client";

import { useRef } from "react";

/** A glow that follows the pointer across a dark section. */
export function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={onMove} className={`relative ${className}`}>
      <div aria-hidden className="spotlight pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
}
