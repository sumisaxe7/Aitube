import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const videos = await prisma.video.findMany({
    where: { creatorId: creator.id },
    include: { processing: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("studio.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{creator.displayName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/studio/help">{t("nav.help")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio/analytics">{t("nav.analytics")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio/collaborations">{t("nav.collaborations")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio/monetization">{t("nav.monetization")}</Link>
          </Button>
          <Button asChild>
            <Link href="/upload">{t("nav.upload")}</Link>
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {t("studio.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.title}</p>
                  {v.processing?.messageKey && (
                    <p className="truncate text-xs text-muted-foreground">
                      {t(v.processing.messageKey)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={v.status} t={t} />
                  {v.status === "PUBLISHED" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/watch/${v.id}`}>{t("studio.view")}</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/studio/help?video=${v.id}`}>
                        {t("studio.askWhy")}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
