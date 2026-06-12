import { describe, expect, it } from "vitest";

import {
  DEFAULT_QUALITY_CONFIG,
  weightedQualityScore,
  type RatingTriple,
} from "@/lib/quality";

const r = (visual: number, narrative: number, audio: number): RatingTriple => ({
  visual,
  narrative,
  audio,
});
const many = (n: number, t: RatingTriple) => Array.from({ length: n }, () => t);

const { priorMean } = DEFAULT_QUALITY_CONFIG;

describe("weightedQualityScore", () => {
  it("returns 0 and rated=false for an empty rating set", () => {
    const q = weightedQualityScore([]);
    expect(q.score).toBe(0);
    expect(q.rated).toBe(false);
    expect(q.ratingCount).toBe(0);
    expect(q.dimensions).toEqual({ visual: 0, narrative: 0, audio: 0 });
  });

  it("a single high rating is pulled toward the prior, not taken at face value", () => {
    const q = weightedQualityScore([r(5, 5, 5)]);
    expect(q.rated).toBe(true);
    expect(q.ratingCount).toBe(1);
    expect(q.score).toBeGreaterThan(priorMean); // above neutral
    expect(q.score).toBeLessThan(5); // but shrunk below the raw 5
  });

  it("a single low rating is pulled UP toward the prior", () => {
    const q = weightedQualityScore([r(1, 1, 1)]);
    expect(q.score).toBeLessThan(priorMean);
    expect(q.score).toBeGreaterThan(1);
  });

  it("does not unfairly boost low-volume: 1x perfect < 20x good", () => {
    const onePerfect = weightedQualityScore([r(5, 5, 5)]).score;
    const manyGood = weightedQualityScore(many(20, r(4, 4, 4))).score;
    expect(manyGood).toBeGreaterThan(onePerfect);
  });

  it("converges toward the true mean as volume grows", () => {
    const few = weightedQualityScore(many(2, r(5, 5, 5))).score;
    const lots = weightedQualityScore(many(200, r(5, 5, 5))).score;
    expect(lots).toBeGreaterThan(few);
    expect(lots).toBeGreaterThan(4.8); // ~5 with enough volume
  });

  it("identical rating sets tie exactly (deterministic, no leakage)", () => {
    const a = weightedQualityScore([r(4, 5, 3), r(3, 4, 5)]).score;
    const b = weightedQualityScore([r(4, 5, 3), r(3, 4, 5)]).score;
    expect(a).toBe(b);
  });

  it("is monotonic: strictly higher ratings yield a strictly higher score", () => {
    const lo = weightedQualityScore(many(10, r(3, 3, 3))).score;
    const hi = weightedQualityScore(many(10, r(4, 4, 4))).score;
    expect(hi).toBeGreaterThan(lo);
  });

  it("respects the dimension weights (visual carries most by default)", () => {
    // Same totals, but the high marks sit on different dimensions.
    const visualStrong = weightedQualityScore(many(10, r(5, 2, 2))).score;
    const audioStrong = weightedQualityScore(many(10, r(2, 2, 5))).score;
    expect(visualStrong).toBeGreaterThan(audioStrong);
  });

  it("accepts a custom config (weights + prior are configurable)", () => {
    const audioHeavy = weightedQualityScore(many(10, r(2, 2, 5)), {
      weights: { visual: 0, narrative: 0, audio: 1 },
      priorMean: 3.5,
      priorStrength: 8,
    }).score;
    const visualHeavy = weightedQualityScore(many(10, r(2, 2, 5)), {
      weights: { visual: 1, narrative: 0, audio: 0 },
      priorMean: 3.5,
      priorStrength: 8,
    }).score;
    expect(audioHeavy).toBeGreaterThan(visualHeavy);
  });

  it("reports raw per-dimension averages for the breakdown UI", () => {
    const q = weightedQualityScore([r(5, 3, 1), r(3, 3, 3)]);
    expect(q.dimensions).toEqual({ visual: 4, narrative: 3, audio: 2 });
  });

  it("keeps scores within the rating scale", () => {
    const q = weightedQualityScore(many(50, r(5, 5, 5))).score;
    expect(q).toBeGreaterThanOrEqual(1);
    expect(q).toBeLessThanOrEqual(5);
  });
});
