"use client";

import { useEffect } from "react";

/** Keeps the page behind a full-screen live from scrolling. */
export function LockScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return null;
}
