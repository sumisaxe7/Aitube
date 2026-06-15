import Link from "next/link";
import { Star, Play } from "lucide-react";

import { VerifiedBadge } from "@/components/verified-badge";
import { formatDuration } from "@/lib/utils";
import type { VideoSummary } from "@/lib/services";
import type { VideoLabels } from "@/lib/types/feed";

export function VideoCard({ video, labels }: { video: VideoSummary; labels: VideoLabels }) {
  return (
    <Link href={`/watch/${video.id}`} className="block group">
      <div className="overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted/30">
          {video.posterUrl ? (
            <img
              src={video.posterUrl}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/40 to-fuchsia-950/20">
              <Play className="h-10 w-10 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-lg shadow-primary/30">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
          </div>
          {video.provenanceVerified && (
            <div className="absolute start-2 top-2">
              <VerifiedBadge
                label={labels.aiVerified}
                title={labels.aiVerifiedTitle}
                model={video.aiModel}
              />
            </div>
          )}
          <span className="absolute bottom-2 end-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white/90 tabular-nums backdrop-blur-sm">
            {formatDuration(video.durationSec)}
          </span>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{video.creatorName}</p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs capitalize text-muted-foreground">
              {video.genre.toLowerCase()}
            </span>
            {video.ratingCount > 0 ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{video.qualityScore.toFixed(2)}</span>
                <span>· {video.ratingCount}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">{labels.noRatings}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
