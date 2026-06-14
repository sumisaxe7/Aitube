"use client";

import { useState } from "react";

import type { VideoSummary } from "@/lib/services";
import type { ResolvedSection, VideoLabels } from "@/lib/types/feed";
import { SpotlightHero } from "@/components/spotlight-hero";
import { VideoCarousel } from "@/components/video-carousel";

export type { VideoLabels };

const ALL = "ALL";

export function HomeFeed({
  sections,
  spotlight,
  labels,
}: {
  sections: ResolvedSection[];
  spotlight: VideoSummary[];
  labels: VideoLabels;
}) {
  const [activeGenre, setActiveGenre] = useState<string>(ALL);

  const genreSections = sections.filter((s) => s.genre !== null);
  const genres = genreSections.map((s) => ({ key: s.genre!, label: s.title }));

  // When All: show all sections (Featured + Highly Rated + genre rows)
  // When a genre is active: only show that genre's row — curated rows are hidden
  // because they contain all genres and make the filter feel like it does nothing.
  const visibleSections =
    activeGenre === ALL
      ? sections
      : sections.filter((s) => s.genre === activeGenre);

  // Filter the spotlight to match the selected genre too
  const visibleSpotlight =
    activeGenre === ALL
      ? spotlight
      : spotlight.filter((v) => v.genre === activeGenre);

  return (
    <div className="space-y-10">
      <SpotlightHero videos={visibleSpotlight.length > 0 ? visibleSpotlight : spotlight} labels={labels} />

      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGenre(ALL)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeGenre === ALL
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            All
          </button>
          {genres.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveGenre(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeGenre === key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {visibleSections.length > 0 ? (
          visibleSections.map((section) => (
            <VideoCarousel
              key={section.id}
              title={section.title}
              videos={section.items}
              labels={labels}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
            <p className="text-muted-foreground text-sm">No videos in this genre yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
