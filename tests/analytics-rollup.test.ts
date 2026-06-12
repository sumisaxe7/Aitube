import { describe, expect, it } from "vitest";

import {
  dropOffCurve,
  rollupDailyEvents,
  type RollupEvent,
} from "@/lib/analytics/rollup";

const ev = (
  videoId: string,
  type: RollupEvent["type"],
  createdAt: string,
  positionSec?: number,
): RollupEvent => ({ videoId, type, createdAt, positionSec });

describe("rollupDailyEvents", () => {
  it("counts views, sums watch time, and counts completes per video-day", () => {
    const events: RollupEvent[] = [
      ev("v1", "VIEW_START", "2026-06-10T08:00:00Z"),
      ev("v1", "WATCH_PROGRESS", "2026-06-10T08:01:00Z", 120),
      ev("v1", "COMPLETE", "2026-06-10T08:05:00Z"),
      ev("v1", "VIEW_START", "2026-06-10T09:00:00Z"),
      ev("v1", "WATCH_PROGRESS", "2026-06-10T09:01:00Z", 60),
    ];
    const [r] = rollupDailyEvents(events);
    expect(r).toEqual({
      videoId: "v1",
      date: "2026-06-10",
      views: 2,
      watchTimeSec: 180,
      completes: 1,
    });
  });

  it("splits across days and videos, sorted by video then date", () => {
    const rows = rollupDailyEvents([
      ev("v2", "VIEW_START", "2026-06-11T00:30:00Z"),
      ev("v1", "VIEW_START", "2026-06-10T23:00:00Z"),
      ev("v1", "VIEW_START", "2026-06-11T00:10:00Z"),
    ]);
    expect(rows.map((r) => `${r.videoId}:${r.date}`)).toEqual([
      "v1:2026-06-10",
      "v1:2026-06-11",
      "v2:2026-06-11",
    ]);
  });

  it("ignores non-aggregated event types for the core metrics", () => {
    const rows = rollupDailyEvents([
      ev("v1", "RATING", "2026-06-10T08:00:00Z"),
      ev("v1", "SUBSCRIBE", "2026-06-10T08:00:00Z"),
      ev("v1", "TIP", "2026-06-10T08:00:00Z"),
    ]);
    expect(rows[0]).toMatchObject({ views: 0, watchTimeSec: 0, completes: 0 });
  });

  it("returns nothing for no events", () => {
    expect(rollupDailyEvents([])).toEqual([]);
  });
});

describe("dropOffCurve", () => {
  it("is monotonically non-increasing and ends at the fully-watched count", () => {
    // durations: 4 viewers reached 100/250/500/1000s of a 1000s video
    const curve = dropOffCurve([100, 250, 500, 1000], 1000, 10);
    expect(curve).toHaveLength(10);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].reached).toBeLessThanOrEqual(curve[i - 1].reached);
    }
    expect(curve[0]).toEqual({ pct: 10, reached: 4 }); // all reached >=100s
    expect(curve[curve.length - 1]).toEqual({ pct: 100, reached: 1 }); // only the completer
  });

  it("handles zero/invalid duration gracefully", () => {
    expect(dropOffCurve([10, 20], 0)).toEqual([]);
  });
});
