"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Play, Star, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

import type { VideoSummary } from "@/lib/services";
import type { VideoLabels } from "@/lib/types/feed";
import { formatDuration } from "@/lib/utils";

export function SpotlightHero({ videos, labels }: { videos: VideoSummary[]; labels: VideoLabels }) {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (next: number) => {
      setAnimating(true);
      setTimeout(() => {
        setIdx(next);
        setAnimating(false);
      }, 250);
    },
    [],
  );

  const prev = () => go((idx - 1 + videos.length) % videos.length);
  const next = () => go((idx + 1) % videos.length);

  useEffect(() => {
    const t = setTimeout(() => go((idx + 1) % videos.length), 6000);
    return () => clearTimeout(t);
  }, [idx, go, videos.length]);

  if (videos.length === 0) return null;
  const safeIdx = Math.min(idx, videos.length - 1);
  const v = videos[safeIdx];

  return (
    <div className="relative h-[380px] overflow-hidden rounded-2xl border border-white/5">
      {/* Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
        {v.posterUrl ? (
          <img src={v.posterUrl} alt={v.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-950 via-background to-fuchsia-950/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className={`relative flex h-full flex-col justify-end p-8 transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
        <div className="max-w-xl space-y-3">
          {v.provenanceVerified && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <ShieldCheck className="h-3 w-3" />
              {labels.aiVerified} · {v.aiModel}
            </div>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">{v.title}</h2>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>{v.creatorName}</span>
            <span className="capitalize">{v.genre.toLowerCase()}</span>
            <span>{formatDuration(v.durationSec)}</span>
            {v.ratingCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {v.qualityScore.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Link
              href={`/watch/${v.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90"
            >
              <Play className="h-4 w-4 fill-black" />
              Watch Now
            </Link>
            <Link
              href={`/watch/${v.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/70">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/70">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 right-8 flex gap-1.5">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${i === safeIdx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </div>
  );
}
