import { selectProvider } from "../factory";
import type { RecommenderService } from "./types";
import { mockRecommender } from "./mock";

export * from "./types";
export { scoreVideo, rankVideos } from "./rank";
export type { RatingTriple } from "./rank";

export const recommender = selectProvider<RecommenderService>("RECOMMENDER_PROVIDER", {
  mock: () => mockRecommender,
});
