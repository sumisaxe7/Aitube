import { describe, expect, it } from "vitest";

import { splitCollaborationGross } from "@/lib/collaboration";

describe("splitCollaborationGross (multi-party, reuses Phase 3 split)", () => {
  it("splits gross by share with no leakage", () => {
    const out = splitCollaborationGross(10_000, [
      { creatorId: "a", sharePct: 60 },
      { creatorId: "b", sharePct: 40 },
    ]);
    expect(out.map((o) => o.grossCents)).toEqual([6000, 4000]);
    expect(out.reduce((s, x) => s + x.grossCents, 0)).toBe(10_000);
  });

  it("keeps every row internally consistent: net + fee === gross", () => {
    const out = splitCollaborationGross(9999, [
      { creatorId: "a", sharePct: 33 },
      { creatorId: "b", sharePct: 33 },
      { creatorId: "c", sharePct: 34 },
    ]);
    for (const r of out) {
      expect(r.netCents + r.platformFeeCents).toBe(r.grossCents);
    }
    expect(out.reduce((s, x) => s + x.grossCents, 0)).toBe(9999);
  });

  it("never leaks a cent for indivisible amounts across co-creators", () => {
    for (const amount of [1, 7, 101, 99_999]) {
      const out = splitCollaborationGross(amount, [
        { creatorId: "a", sharePct: 34 },
        { creatorId: "b", sharePct: 33 },
        { creatorId: "c", sharePct: 33 },
      ]);
      expect(out.reduce((s, x) => s + x.grossCents, 0)).toBe(amount);
    }
  });

  it("throws when shares do not sum to 100%", () => {
    expect(() =>
      splitCollaborationGross(100, [
        { creatorId: "a", sharePct: 50 },
        { creatorId: "b", sharePct: 30 },
      ]),
    ).toThrow(/sum to 100/);
  });
});
