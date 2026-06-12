import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { formatDuration } from "@/lib/utils";
import type { VideoSummary } from "@/lib/services";

type Translate = (key: string) => string;

export function VideoCard({
  video,
  t,
}: {
  video: VideoSummary;
  t: Translate;
}) {
  return (
    <Link href={`/watch/${video.id}`} className="block">
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="relative aspect-video bg-muted"
        style={
          video.posterUrl
            ? {
                backgroundImage: `url(${video.posterUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {video.provenanceVerified && (
          <div className="absolute start-2 top-2">
            <VerifiedBadge
              label={t("badge.aiVerified")}
              title={t("badge.aiVerifiedTitle")}
              model={video.aiModel}
            />
          </div>
        )}
        <span className="absolute bottom-2 end-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.durationSec)}
        </span>
      </div>
      <CardContent className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("video.by")} {video.creatorName}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">
            {video.genre.toLowerCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {video.ratingCount > 0
              ? `★ ${video.qualityScore.toFixed(2)} · ${video.ratingCount} ${t("video.ratings")}`
              : t("video.noRatings")}
          </span>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
