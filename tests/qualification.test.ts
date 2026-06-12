import { describe, expect, it } from "vitest";

import {
  DEFAULT_MONETIZATION_RULE,
  qualifiesForMonetization,
} from "@/lib/qualification";

const rule = { minPublishedVideos: 3, minQualityScore: 3.8 };

describe("qualifiesForMonetization", () => {
  it("qualifies when both volume and quality bars are met", () => {
    const r = qualifiesForMonetization(
      { publishedVideoCount: 3, topQualityScore: 4.0 },
      rule,
    );
    expect(r.qualified).toBe(true);
    expect(r.meetsVideoCount).toBe(true);
    expect(r.meetsQuality).toBe(true);
  });

  it("fails on too few videos even with high quality", () => {
    const r = qualifiesForMonetization(
      { publishedVideoCount: 2, topQualityScore: 4.9 },
      rule,
    );
    expect(r.qualified).toBe(false);
    expect(r.meetsVideoCount).toBe(false);
    expect(r.meetsQuality).toBe(true);
  });

  it("fails on low quality even with many videos (high-craft gate)", () => {
    const r = qualifiesForMonetization(
      { publishedVideoCount: 50, topQualityScore: 3.0 },
      rule,
    );
    expect(r.qualified).toBe(false);
    expect(r.meetsQuality).toBe(false);
  });

  it("treats the thresholds as inclusive boundaries", () => {
    const r = qualifiesForMonetization(
      { publishedVideoCount: 3, topQualityScore: 3.8 },
      rule,
    );
    expect(r.qualified).toBe(true);
  });

  it("uses a sensible default rule when none is passed", () => {
    expect(DEFAULT_MONETIZATION_RULE.minPublishedVideos).toBeGreaterThan(0);
    expect(DEFAULT_MONETIZATION_RULE.minQualityScore).toBeGreaterThan(0);
    const r = qualifiesForMonetization({
      publishedVideoCount: 0,
      topQualityScore: 0,
    });
    expect(r.qualified).toBe(false);
  });
});
