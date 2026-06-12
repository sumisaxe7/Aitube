import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createCollaborationAction } from "@/app/actions/collab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CollaborationsPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const collaborations = await prisma.collaboration.findMany({
    where: { collaborators: { some: { creatorId: creator.id } } },
    include: { collaborators: true, owner: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("collab.title")}</h1>

      <Card>
        <CardContent className="p-4">
          <form action={createCollaborationAction} className="flex gap-2">
            <input
              name="title"
              placeholder={t("collab.newPlaceholder")}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit">{t("collab.create")}</Button>
          </form>
        </CardContent>
      </Card>

      {collaborations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("collab.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {collaborations.map((c) => {
            const mine = c.collaborators.find((m) => m.creatorId === creator.id);
            return (
              <Link
                key={c.id}
                href={`/studio/collaborations/${c.id}`}
                className="block"
              >
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.collaborators.length} {t("collab.members")} ·{" "}
                        {t("collab.owner")}: {c.owner.displayName}
                      </p>
                    </div>
                    {mine?.status === "INVITED" && (
                      <Badge variant="outline">{t("collab.invited")}</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
