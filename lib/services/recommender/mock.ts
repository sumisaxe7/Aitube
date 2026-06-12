import { prisma } from "@/lib/db";
import type { FeedSection, RecommenderService, VideoSummary } from "./types";
import { rankVideos } from "./rank";

// Reads seeded videos from Postgres and ranks them into home-feed sections.
// Only PUBLISHED videos are ever returned (nothing is viewer-visible pre-publish).
export const mockRecommender: RecommenderService = {
  async getHomeFeed(): Promise<FeedSection[]> {
    const videos = await prisma.video.findMany({
      where: { status: "PUBLISHED" },
      include: {
        creator: true,
        ratings: { select: { visual: true, narrative: true, audio: true } },
      },
    });

    const ranked = rankVideos(
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        genre: v.genre,
        creatorName: v.creator.displayName,
        creatorHandle: v.creator.handle,
        posterUrl: v.posterUrl,
        durationSec: v.durationSec,
        aiModel: v.aiModel,
        provenanceVerified: v.provenanceVerified,
        ratings: v.ratings,
      })),
    );

    const toSummary = (r: (typeof ranked)[number]): VideoSummary => ({
      id: r.id,
      title: r.title,
      genre: r.genre,
      creatorName: r.creatorName,
      creatorHandle: r.creatorHandle,
      posterUrl: r.posterUrl,
      durationSec: r.durationSec,
      aiModel: r.aiModel,
      provenanceVerified: r.provenanceVerified,
      qualityScore: r.qualityScore,
      ratingCount: r.ratingCount,
    });

    // "Highly Rated" is driven by the quality score, NOT view count (CLAUDE.md).
    const highlyRated = ranked.slice(0, 6).map(toSummary);

    // "Featured" curated grid — stable order by title for the mock so the page is
    // deterministic. A real recommender personalizes this per viewer.
    const featured = [...ranked]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(toSummary);

    return [
      { id: "featured", titleKey: "home.section.featured", items: featured },
      { id: "highly-rated", titleKey: "home.section.highlyRated", items: highlyRated },
    ];
  },
};
