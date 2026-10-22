"use client";

import { useEffect } from "react";

/** Counts this person as watching while the live is open. */
export function ViewerPresence({ showId }: { showId: number }) {
  useEffect(() => {
    const send = (kind: "pulse" | "leave") => {
      const body = JSON.stringify({ showId, kind });
      if (kind === "leave" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/live-viewer", new Blob([body], { type: "application/json" }));
        return;
      }
      void fetch("/api/live-viewer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    };

    send("pulse");
    const timer = setInterval(() => send("pulse"), 10000);
    const onHide = () => send("leave");
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", onHide);
      send("leave");
    };
  }, [showId]);

  return null;
}
