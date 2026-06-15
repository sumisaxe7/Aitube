import Link from "next/link";
import { redirect } from "next/navigation";
import { Upload, BarChart2, Users, DollarSign, HelpCircle, Film } from "lucide-react";

import { auth } from "@/lib/auth";
import { getCurrentCreator } from "@/lib/session";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DeleteVideoButton } from "@/components/delete-video-button";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const t = getTranslator(DEFAULT_LOCALE);
  const videos = await prisma.video.findMany({
    where: isAdmin ? {} : { creatorId: creator.id },
    include: { processing: true },
    orderBy: { createdAt: "desc" },
  });

  const quickLinks = [
    { href: "/studio/analytics", icon: BarChart2, label: t("nav.analytics") },
    { href: "/studio/collaborations", icon: Users, label: t("nav.collaborations") },
    { href: "/studio/monetization", icon: DollarSign, label: t("nav.monetization") },
    { href: "/studio/help", icon: HelpCircle, label: t("nav.help") },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            {t("studio.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{creator.displayName}</p>
        </div>
        <Button asChild className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
          <Link href="/upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("nav.upload")}
          </Link>
        </Button>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-card px-4 py-3 text-sm font-medium transition-all hover:border-primary/20 hover:bg-white/5 hover:text-primary"
          >
            <Icon className="h-4 w-4 text-primary/60" />
            {label}
          </Link>
        ))}
      </div>

      {/* Videos */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Videos</h2>
        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center">
            <Film className="mx-auto mb-3 h-8 w-8 text-primary/30" />
            <p className="text-sm text-muted-foreground">{t("studio.empty")}</p>
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/upload">{t("nav.upload")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-card px-4 py-3 transition-colors hover:border-white/10"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Film className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{v.title}</p>
                    {v.processing?.messageKey && (
                      <p className="truncate text-xs text-muted-foreground">
                        {t(v.processing.messageKey)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={v.status} t={t} />
                  <div className="flex items-center gap-2">
                    {v.status === "PUBLISHED" ? (
                      <Button asChild variant="outline" size="sm" className="border-white/10 hover:border-white/20">
                        <Link href={`/watch/${v.id}`}>{t("studio.view")}</Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <Link href={`/studio/help?video=${v.id}`}>
                          {t("studio.askWhy")}
                        </Link>
                      </Button>
                    )}
                    <DeleteVideoButton videoId={v.id} label={t("studio.delete")} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
