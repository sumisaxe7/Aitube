import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { weightedQualityScore } from "@/lib/quality";
import { VideoCard } from "@/components/video-card";
import { SubscribeTip } from "@/components/subscribe-tip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { formatUsd } from "@/lib/utils";
import type { VideoSummary } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const t = getTranslator(DEFAULT_LOCALE);
  const creator = await prisma.creatorProfile.findUnique({
    where: { handle },
    include: {
      videos: {
        where: { status: "PUBLISHED" },
        include: {
          ratings: { select: { visual: true, narrative: true, audio: true } },
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  if (!creator) notFound();

  const user = await getSessionUser();
  const isSelf = user?.creatorId === creator.id;
  const canSubscribe = Boolean(creator.subscriptionPriceCents);
  const priceLabel = creator.subscriptionPriceCents
    ? `${formatUsd(creator.subscriptionPriceCents)}/mo`
    : "";

  const summaries: VideoSummary[] = creator.videos.map((v) => {
    const q = weightedQualityScore(v.ratings);
    return {
      id: v.id,
      title: v.title,
      genre: v.genre,
      creatorName: creator.displayName,
      creatorHandle: creator.handle,
      posterUrl: v.posterUrl,
      durationSec: v.durationSec,
      aiModel: v.aiModel,
      provenanceVerified: v.provenanceVerified,
      qualityScore: q.score,
      ratingCount: q.ratingCount,
    };
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {creator.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">@{creator.handle}</p>
          {creator.bio && <p className="text-sm">{creator.bio}</p>}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("monetize.support")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canSubscribe && !isSelf && (
              <p className="text-xs text-muted-foreground">
                {t("monetize.notMonetizedYet")}
              </p>
            )}
            <SubscribeTip
              handle={creator.handle}
              signedIn={Boolean(user?.id)}
              isSelf={isSelf}
              canSubscribe={canSubscribe}
              priceLabel={priceLabel}
            />
          </CardContent>
        </Card>
      </div>

      {summaries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {summaries.map((v) => (
            <VideoCard key={v.id} video={v} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
