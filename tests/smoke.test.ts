import { describe, expect, it } from "vitest";

import { rankVideos, scoreVideo, type RatingTriple } from "@/lib/services/recommender/rank";

const r = (visual: number, narrative: number, audio: number): RatingTriple => ({
  visual,
  narrative,
  audio,
});

describe("home-feed ranking (pure logic)", () => {
  it("scores an unrated video as 0", () => {
    expect(scoreVideo([])).toBe(0);
  });

  it("scores a perfectly-rated video below 5 due to confidence weighting", () => {
    const score = scoreVideo([r(5, 5, 5), r(5, 5, 5), r(5, 5, 5)]);
    expect(score).toBeGreaterThan(3);
    expect(score).toBeLessThan(5);
  });

  it("does not let one 5-star rating outrank a heavily-rated 4.8", () => {
    const oneFiveStar = scoreVideo([r(5, 5, 5)]);
    const manyHigh = scoreVideo(Array.from({ length: 40 }, () => r(5, 5, 4)));
    expect(manyHigh).toBeGreaterThan(oneFiveStar);
  });

  it("ranks higher-rated videos above lower-rated ones and attaches counts", () => {
    const ranked = rankVideos([
      { id: "low", ratings: [r(2, 2, 3), r(3, 2, 2)] },
      { id: "high", ratings: [r(5, 5, 5), r(5, 4, 5), r(5, 5, 4), r(4, 5, 5)] },
      { id: "mid", ratings: [r(4, 4, 3), r(3, 4, 4), r(4, 3, 4)] },
    ]);

    expect(ranked.map((v) => v.id)).toEqual(["high", "mid", "low"]);
    expect(ranked[0]).toMatchObject({ id: "high", ratingCount: 4 });
    expect(ranked[0].qualityScore).toBeGreaterThan(ranked[1].qualityScore);
  });
});
