"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The database is the source of truth. This only asks the server for a fresh read. */
export function LiveRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => router.refresh(), 2000);
    return () => window.clearInterval(id);
  }, [active, router]);
  return null;
}
