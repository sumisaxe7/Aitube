// Monetization qualification — a single configurable rule (CLAUDE.md / BUILD).
// Pure and tested (tests/qualification.test.ts).

export interface MonetizationRule {
  minPublishedVideos: number;
  minQualityScore: number; // against the creator's best Weighted Quality Score
}

export const DEFAULT_MONETIZATION_RULE: MonetizationRule = {
  minPublishedVideos: Number(process.env.MONETIZATION_MIN_VIDEOS ?? 3),
  minQualityScore: Number(process.env.MONETIZATION_MIN_SCORE ?? 3.8),
};

export interface QualificationInput {
  publishedVideoCount: number;
  topQualityScore: number; // highest WQS among the creator's published videos
}

export interface QualificationResult extends QualificationInput {
  qualified: boolean;
  meetsVideoCount: boolean;
  meetsQuality: boolean;
  rule: MonetizationRule;
}

/**
 * A creator qualifies for monetization when they have at least
 * `minPublishedVideos` published videos AND at least one video whose Weighted
 * Quality Score clears `minQualityScore`. Gating on quality (not just volume) is
 * the "high-craft" promise — you can't monetize a pile of low-rated uploads.
 */
export function qualifiesForMonetization(
  input: QualificationInput,
  rule: MonetizationRule = DEFAULT_MONETIZATION_RULE,
): QualificationResult {
  const meetsVideoCount = input.publishedVideoCount >= rule.minPublishedVideos;
  const meetsQuality = input.topQualityScore >= rule.minQualityScore;
  return {
    ...input,
    qualified: meetsVideoCount && meetsQuality,
    meetsVideoCount,
    meetsQuality,
    rule,
  };
}
