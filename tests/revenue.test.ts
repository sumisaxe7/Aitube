import { describe, expect, it } from "vitest";

import {
  computeSplit,
  creatorSharePct,
  distributeByShares,
  PLATFORM_FEE_RATE,
} from "@/lib/revenue";

describe("computeSplit", () => {
  it("conserves money: net + fee === gross", () => {
    for (const gross of [0, 1, 99, 100, 499, 500, 1000, 12345, 999999]) {
      const s = computeSplit(gross);
      expect(s.platformFeeCents + s.netCents).toBe(s.grossCents);
      expect(s.grossCents).toBe(gross);
    }
  });

  it("takes the configured platform fee (well below YouTube)", () => {
    const s = computeSplit(1000); // $10
    expect(s.platformFeeCents).toBe(Math.round(1000 * PLATFORM_FEE_RATE));
    expect(s.netCents).toBeGreaterThan(s.grossCents * 0.5);
    expect(PLATFORM_FEE_RATE).toBeLessThan(0.3);
  });

  it("supports an overridden fee rate", () => {
    const s = computeSplit(1000, 0.2);
    expect(s.platformFeeCents).toBe(200);
    expect(s.netCents).toBe(800);
  });

  it("rejects invalid input", () => {
    expect(() => computeSplit(-1)).toThrow();
    expect(() => computeSplit(10.5)).toThrow();
    expect(() => computeSplit(100, 1.5)).toThrow();
  });

  it("creatorSharePct reflects the fee", () => {
    expect(creatorSharePct(0.1)).toBe(90);
    expect(creatorSharePct(0.3)).toBe(70);
  });
});

describe("distributeByShares (multi-party, no leakage)", () => {
  it("splits evenly when it divides cleanly", () => {
    const out = distributeByShares(1000, [
      { id: "a", pct: 50 },
      { id: "b", pct: 50 },
    ]);
    expect(out).toEqual([
      { id: "a", amountCents: 500 },
      { id: "b", amountCents: 500 },
    ]);
  });

  it("never leaks a cent on indivisible splits", () => {
    const out = distributeByShares(1000, [
      { id: "a", pct: 33 },
      { id: "b", pct: 33 },
      { id: "c", pct: 34 },
    ]);
    const total = out.reduce((s, x) => s + x.amountCents, 0);
    expect(total).toBe(1000);
  });

  it("sum always equals the input for tricky amounts and 3-way thirds", () => {
    for (const amount of [1, 7, 101, 999, 100001]) {
      const out = distributeByShares(amount, [
        { id: "a", pct: 33.34 },
        { id: "b", pct: 33.33 },
        { id: "c", pct: 33.33 },
      ]);
      expect(out.reduce((s, x) => s + x.amountCents, 0)).toBe(amount);
    }
  });

  it("preserves input order", () => {
    const out = distributeByShares(100, [
      { id: "x", pct: 70 },
      { id: "y", pct: 30 },
    ]);
    expect(out.map((o) => o.id)).toEqual(["x", "y"]);
  });

  it("rejects shares that do not sum to 100", () => {
    expect(() =>
      distributeByShares(100, [
        { id: "a", pct: 60 },
        { id: "b", pct: 30 },
      ]),
    ).toThrow(/sum to 100/);
  });
});
