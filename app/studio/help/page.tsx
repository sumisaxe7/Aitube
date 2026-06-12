import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { prisma } from "@/lib/db";
import { HelpChat } from "@/components/help-chat";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>;
}) {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const { video } = await searchParams;
  const videos = await prisma.video.findMany({
    where: { creatorId: creator.id },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("help.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("help.subtitle")}</p>
      </div>
      <HelpChat videos={videos} initialVideoId={video} />
    </div>
  );
}
