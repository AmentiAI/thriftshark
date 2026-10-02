"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "up" | "left" | "scale";

const VARIANTS: Record<Variant, string> = {
  up: "reveal",
  left: "reveal-left",
  scale: "reveal-scale",
};

/**
 * Reveals its children once they scroll into view. The transition lives in CSS
 * so nothing animates on the server render, and prefers-reduced-motion users
 * simply get the finished state.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "h2" | "p";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer: show it on the next tick rather than mid-effect.
      const id = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // One ref type across every tag this renders.
  const Element = Tag as React.ElementType;

  return (
    <Element
      ref={ref}
      className={`${VARIANTS[variant]} ${shown ? "is-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Element>
  );
}
