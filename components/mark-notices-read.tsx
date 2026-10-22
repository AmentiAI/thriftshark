"use client";

import { useEffect } from "react";
import { markNoticesRead } from "@/lib/actions";

/** Clears the unread badge once the shop has seen its notices. */
export function MarkNoticesRead({ unread }: { unread: number }) {
  useEffect(() => {
    if (unread > 0) void markNoticesRead();
  }, [unread]);
  return null;
}
