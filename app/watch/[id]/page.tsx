import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";

import { prisma } from "@/lib/db";
import { getCurrentCreator, getSessionUser } from "@/lib/session";
import { auth } from "@/lib/auth";
import { weightedQualityScore } from "@/lib/quality";
import { VerifiedBadge } from "@/components/verified-badge";
import { ProvenancePanel } from "@/components/provenance-panel";
import { ViewBeacon } from "@/components/view-beacon";
import { QualityBreakdown } from "@/components/quality-breakdown";
import { RatingWidget } from "@/components/rating-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteVideoButton } from "@/components/delete-video-button";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = getTranslator(DEFAULT_LOCALE);
  const user = await getSessionUser();
  const creator = await getCurrentCreator();
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      creator: true,
      processing: true,
      ratings: { select: { visual: true, narrative: true, audio: true } },
    },
  });

  // Gating: nothing is viewer-visible unless PUBLISHED.
  if (!video || video.status !== "PUBLISHED") notFound();

  const quality = weightedQualityScore(video.ratings);
  const p = video.processing;

  // Co-creator credits (Phase 5).
  const collaboration = await prisma.collaboration.findFirst({
    where: { videoId: video.id },
    include: {
      collaborators: {
        where: { status: "ACCEPTED" },
        include: { creator: true },
        orderBy: { sharePct: "desc" },
      },
    },
  });
  const credits = collaboration?.collaborators ?? [];

  const myRating = user?.id
    ? await prisma.rating.findUnique({
        where: { videoId_userId: { videoId: id, userId: user.id } },
        select: { visual: true, narrative: true, audio: true },
      })
    : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
      <ViewBeacon videoId={video.id} durationSec={video.durationSec} />
      <div className="space-y-6">
        <VideoPlayer
          videoId={video.id}
          initialPlaybackId={video.muxPlaybackId}
          initialVideoUrl={video.videoUrl}
          posterUrl={video.posterUrl}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("video.by")} {video.creator.displayName}
              </span>
              <Badge variant="secondary" className="capitalize">
                {video.genre.toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {video.provenanceVerified && (
              <VerifiedBadge
                label={t("badge.aiVerified")}
                title={t("badge.aiVerifiedTitle")}
                model={video.aiModel}
              />
            )}
            {(creator?.id === video.creatorId || isAdmin) && (
              <DeleteVideoButton videoId={video.id} label={t("studio.delete")} />
            )}
          </div>
        </div>

        {video.description && <p className="text-sm">{video.description}</p>}

        {credits.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("collab.credits")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {credits.map((m) => (
                <div key={m.id} className="flex justify-between">
                  <span>{m.creator.displayName}</span>
                  <span className="text-muted-foreground">{m.sharePct}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <ProvenancePanel
          aiModel={p?.aiModel ?? video.aiModel}
          generator={p?.provenanceGenerator ?? video.aiModel}
          hasCredentials={p?.provenanceHasCredentials ?? video.provenanceVerified}
          t={t}
        />
      </div>

      <aside className="space-y-6">
        <QualityBreakdown quality={quality} t={t} />
        <RatingWidget
          videoId={video.id}
          signedIn={Boolean(user?.id)}
          initial={myRating}
        />
      </aside>
    </div>
  );
}
