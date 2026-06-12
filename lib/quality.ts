// Weighted Quality Score — the platform's "high-craft" signal. Pure and heavily
// tested (tests/quality.test.ts). Kept out of any component so it has one home.

export interface RatingTriple {
  visual: number;
  narrative: number;
  audio: number;
}

export interface QualityConfig {
  weights: { visual: number; narrative: number; audio: number };
  priorMean: number; // C — the global prior the score regresses toward
  priorStrength: number; // m — pseudo-count of prior ratings (confidence)
}

/**
 * Default weighting — justified:
 * - Visual Consistency (0.40): temporal/visual coherence is the hardest thing for
 *   current AI video models and the strongest "craft" differentiator, so it carries
 *   the most weight.
 * - Narrative/Script (0.35): a close second — structure is what separates a clip
 *   from a film.
 * - Audio/Voice (0.25): often a separate TTS/score pass and easier to get right, so
 *   it counts least.
 * priorMean 3.5 = neutral-positive midpoint of the 1..5 scale.
 * priorStrength 8 = a video needs ~8 ratings before its own mean outweighs the
 * prior, so a single 5-star cannot catapult a low-volume video above a
 * heavily-rated good one (the "don't unfairly boost low-volume" requirement).
 */
export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  weights: { visual: 0.4, narrative: 0.35, audio: 0.25 },
  priorMean: 3.5,
  priorStrength: 8,
};

export interface QualityResult {
  score: number; // 0 when unrated; else a Bayesian weighted score in ~[1,5]
  rated: boolean;
  ratingCount: number;
  dimensions: { visual: number; narrative: number; audio: number }; // raw averages
}

const avg = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const round = (n: number, dp = 3) => Number(n.toFixed(dp));

/**
 * Confidence-weighted (Bayesian) Weighted Quality Score.
 *
 * 1. Average each dimension across all ratings.
 * 2. Combine into a weighted composite using `weights` (normalized, so they need
 *    not sum to exactly 1).
 * 3. Shrink the composite toward `priorMean` by rating count:
 *      score = (n·mean + m·C) / (n + m)
 *    Low-volume videos sit near the prior; the score approaches the true mean as
 *    ratings accumulate. This is a standard Bayesian average (the "IMDb top-250"
 *    formula) and is why a lone 5-star can't outrank a well-rated catalogue title.
 *
 * Unrated videos return score 0 (so they sort last and render "Not yet rated").
 */
export function weightedQualityScore(
  ratings: RatingTriple[],
  config: QualityConfig = DEFAULT_QUALITY_CONFIG,
): QualityResult {
  const ratingCount = ratings.length;
  if (ratingCount === 0) {
    return {
      score: 0,
      rated: false,
      ratingCount: 0,
      dimensions: { visual: 0, narrative: 0, audio: 0 },
    };
  }

  const { weights, priorMean, priorStrength } = config;
  const visual = avg(ratings.map((r) => r.visual));
  const narrative = avg(ratings.map((r) => r.narrative));
  const audio = avg(ratings.map((r) => r.audio));

  const weightSum = weights.visual + weights.narrative + weights.audio;
  const weightedMean =
    (visual * weights.visual +
      narrative * weights.narrative +
      audio * weights.audio) /
    weightSum;

  const score =
    (ratingCount * weightedMean + priorStrength * priorMean) /
    (ratingCount + priorStrength);

  return {
    score: round(score),
    rated: true,
    ratingCount,
    dimensions: {
      visual: round(visual, 2),
      narrative: round(narrative, 2),
      audio: round(audio, 2),
    },
  };
}
