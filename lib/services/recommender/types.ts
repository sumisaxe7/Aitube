import type { Genre } from "@prisma/client";

// Ranking / personalization. Real later: Recombee / Amazon Personalize.
export interface VideoSummary {
  id: string;
  title: string;
  genre: Genre;
  creatorName: string;
  creatorHandle: string;
  posterUrl: string | null;
  durationSec: number;
  aiModel: string | null;
  provenanceVerified: boolean;
  qualityScore: number;
  ratingCount: number;
}

export interface FeedSection {
  id: string;
  /** i18n key resolved on the page (strings stay out of the service). */
  titleKey: string;
  /** null for curated rows; Genre value for per-genre rows. */
  genre: Genre | null;
  /** Human-readable label for genre rows e.g. "Sci-Fi". */
  genreLabel?: string;
  items: VideoSummary[];
}

export interface HomeFeedOptions {
  locale?: string;
}

export interface RecommenderService {
  getHomeFeed(options?: HomeFeedOptions): Promise<FeedSection[]>;
}
