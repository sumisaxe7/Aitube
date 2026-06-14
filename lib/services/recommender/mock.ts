import type { Genre } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { RatingTriple } from "@/lib/quality";
import type { FeedSection, RecommenderService, VideoSummary } from "./types";
import { rankVideos } from "./rank";

const FALLBACK_VIDEOS: VideoSummary[] = [
  {
    id: "fallback-1",
    title: "The Last Orbital Garden",
    genre: "SCIFI" as Genre,
    creatorName: "NovaFrame Studio",
    creatorHandle: "novaframe",
    posterUrl: null,
    durationSec: 372,
    aiModel: "OpenAI Sora",
    provenanceVerified: true,
    qualityScore: 4.7,
    ratingCount: 12,
  },
  {
    id: "fallback-2",
    title: "Paper Lanterns at Dawn",
    genre: "ANIME" as Genre,
    creatorName: "InkMotion",
    creatorHandle: "inkmotion",
    posterUrl: null,
    durationSec: 412,
    aiModel: "Kling",
    provenanceVerified: true,
    qualityScore: 4.6,
    ratingCount: 9,
  },
  {
    id: "fallback-3",
    title: "Deep Time: A Coastline Story",
    genre: "DOCUMENTARY" as Genre,
    creatorName: "Reality Algorithm",
    creatorHandle: "realityalgo",
    posterUrl: null,
    durationSec: 638,
    aiModel: "Google Veo",
    provenanceVerified: true,
    qualityScore: 4.8,
    ratingCount: 15,
  },
];

function buildFallbackSections(): FeedSection[] {
  return [
    { id: "featured", titleKey: "home.section.featured", items: FALLBACK_VIDEOS },
    {
      id: "highly-rated",
      titleKey: "home.section.highlyRated",
      items: [...FALLBACK_VIDEOS].sort((a, b) => b.qualityScore - a.qualityScore),
    },
  ];
}

interface RankedVideoInput {
  id: string;
  title: string;
  genre: Genre;
  creatorName: string;
  creatorHandle: string;
  posterUrl: string | null;
  durationSec: number;
  aiModel: string | null;
  provenanceVerified: boolean;
  ratings: RatingTriple[];
}

// Reads seeded videos from Postgres and ranks them into home-feed sections.
// Only PUBLISHED videos are ever returned (nothing is viewer-visible pre-publish).
export const mockRecommender: RecommenderService = {
  async getHomeFeed(): Promise<FeedSection[]> {
    try {
      const videos = await prisma.video.findMany({
        where: { status: "PUBLISHED" },
        include: {
          creator: true,
          ratings: { select: { visual: true, narrative: true, audio: true } },
        },
      });

      const ranked = rankVideos<RankedVideoInput>(
        videos.map((v): RankedVideoInput => ({
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

      const highlyRated = ranked.slice(0, 6).map(toSummary);
      const featured = [...ranked]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(toSummary);

      return [
        { id: "featured", titleKey: "home.section.featured", items: featured },
        { id: "highly-rated", titleKey: "home.section.highlyRated", items: highlyRated },
      ];
    } catch (error) {
      console.warn("Falling back to static homepage feed because Prisma is unavailable:", error);
      return buildFallbackSections();
    }
  },
};
