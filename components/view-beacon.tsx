"use client";

import { useEffect } from "react";

// Fires mock viewer events for analytics as a viewer opens a watch page.
export function ViewBeacon({
  videoId,
  durationSec,
}: {
  videoId: string;
  durationSec: number;
}) {
  useEffect(() => {
    const send = (type: string, extra: Record<string, unknown> = {}) =>
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId, type, ...extra }),
        keepalive: true,
      }).catch(() => {});

    send("VIEW_START");
    const furthest = Math.floor(durationSec * (0.3 + Math.random() * 0.7));
    const timer = setTimeout(() => {
      send("WATCH_PROGRESS", { positionSec: furthest });
      if (furthest >= durationSec * 0.95) send("COMPLETE");
    }, 2500);
    return () => clearTimeout(timer);
  }, [videoId, durationSec]);

  return null;
}
