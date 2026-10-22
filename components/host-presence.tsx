"use client";

import { useEffect } from "react";

function token() {
  return `h${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`.slice(0, 40);
}

/** Tells the server this host tab is still open. Closing the tab ends the live. */
export function HostPresence({ showId }: { showId: number }) {
  useEffect(() => {
    const tab = token();
    const send = (kind: "pulse" | "leave") => {
      const body = JSON.stringify({ showId, token: tab, kind });
      if (kind === "leave" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/live-host", new Blob([body], { type: "application/json" }));
        return;
      }
      void fetch("/api/live-host", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    };

    send("pulse");
    const timer = setInterval(() => send("pulse"), 8000);
    const onHide = () => send("leave");
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", onHide);
    };
  }, [showId]);

  return null;
}
