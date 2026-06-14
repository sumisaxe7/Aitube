import type { Genre } from "@prisma/client";
import type { VideoSummary } from "@/lib/services";

export interface ResolvedSection {
  id: string;
  title: string;
  genre: Genre | null;
  items: VideoSummary[];
}

export interface VideoLabels {
  aiVerified: string;
  aiVerifiedTitle: string;
  noRatings: string;
}
