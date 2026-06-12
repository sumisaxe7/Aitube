import { weightedQualityScore, type RatingTriple } from "@/lib/quality";

// The recommender ranks on the Weighted Quality Score (see lib/quality.ts), NOT
// view count — that is the whole point of the "Highly Rated" row.
export type { RatingTriple } from "@/lib/quality";

export function scoreVideo(ratings: RatingTriple[]): number {
  return weightedQualityScore(ratings).score;
}

export function rankVideos<T extends { ratings: RatingTriple[] }>(
  videos: T[],
): Array<T & { qualityScore: number; ratingCount: number }> {
  return videos
    .map((v) => ({
      ...v,
      qualityScore: scoreVideo(v.ratings),
      ratingCount: v.ratings.length,
    }))
    .sort((a, b) => b.qualityScore - a.qualityScore);
}
