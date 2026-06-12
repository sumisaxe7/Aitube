// Analytics rollup — pure and tested (tests/analytics-rollup.test.ts). Raw events
// live in a table; these functions precompute the per-day aggregates the dashboard
// reads, and the drop-off curve.

export type RollupEventType =
  | "VIEW_START"
  | "WATCH_PROGRESS"
  | "COMPLETE"
  | "RATING"
  | "SUBSCRIBE"
  | "TIP";

export interface RollupEvent {
  videoId: string;
  type: RollupEventType;
  // For WATCH_PROGRESS: the furthest playback position reached in that view
  // (this build emits one terminal progress ping per view).
  positionSec?: number | null;
  createdAt: Date | string;
}

export interface DailyRollupData {
  videoId: string;
  date: string; // YYYY-MM-DD (UTC)
  views: number;
  watchTimeSec: number;
  completes: number;
}

function utcDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** Aggregate raw events into per-(video, UTC-day) rollups. */
export function rollupDailyEvents(events: RollupEvent[]): DailyRollupData[] {
  const map = new Map<string, DailyRollupData>();
  for (const e of events) {
    const day = utcDay(e.createdAt);
    const key = `${e.videoId}|${day}`;
    let r = map.get(key);
    if (!r) {
      r = { videoId: e.videoId, date: day, views: 0, watchTimeSec: 0, completes: 0 };
      map.set(key, r);
    }
    if (e.type === "VIEW_START") r.views += 1;
    else if (e.type === "WATCH_PROGRESS") r.watchTimeSec += Math.max(0, e.positionSec ?? 0);
    else if (e.type === "COMPLETE") r.completes += 1;
  }
  return [...map.values()].sort((a, b) =>
    a.videoId === b.videoId
      ? a.date.localeCompare(b.date)
      : a.videoId.localeCompare(b.videoId),
  );
}

export interface DropOffBucket {
  pct: number; // milestone, e.g. 10, 20, ... 100
  reached: number; // views that reached at least this far
}

/**
 * Drop-off curve: for each milestone (deciles by default), how many views reached
 * at least that far. `furthestPositions` is one entry per view (the furthest
 * position that view reached). Monotonically non-increasing by construction.
 */
export function dropOffCurve(
  furthestPositions: number[],
  durationSec: number,
  buckets = 10,
): DropOffBucket[] {
  if (durationSec <= 0 || buckets <= 0) return [];
  const out: DropOffBucket[] = [];
  for (let i = 1; i <= buckets; i++) {
    const threshold = (durationSec * i) / buckets;
    const reached = furthestPositions.filter((p) => p >= threshold).length;
    out.push({ pct: Math.round((i / buckets) * 100), reached });
  }
  return out;
}
