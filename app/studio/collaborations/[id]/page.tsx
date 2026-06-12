import { notFound, redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  addNoteAction,
  distributeAction,
  inviteAction,
  respondAction,
  setSharesAction,
} from "@/app/actions/collab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-md border border-input bg-background px-3 py-2 text-sm";

export default async function CollaborationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const collab = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      collaborators: { include: { creator: true }, orderBy: { createdAt: "asc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      video: true,
    },
  });
  if (!collab) notFound();

  const me = collab.collaborators.find((m) => m.creatorId === creator.id);
  if (!me) notFound();
  const isOwner = collab.ownerId === creator.id;
  const accepted = collab.collaborators.filter((m) => m.status === "ACCEPTED");
  const shareTotal = accepted.reduce((s, m) => s + m.sharePct, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{collab.title}</h1>
        {collab.video && (
          <p className="text-sm text-muted-foreground">
            {t("collab.onVideo")}: {collab.video.title}
          </p>
        )}
      </div>

      {me.status === "INVITED" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm">{t("collab.invitePending")}</span>
            <div className="flex gap-2">
              <form action={respondAction}>
                <input type="hidden" name="collaborationId" value={collab.id} />
                <input type="hidden" name="accept" value="true" />
                <Button size="sm" type="submit">
                  {t("collab.accept")}
                </Button>
              </form>
              <form action={respondAction}>
                <input type="hidden" name="collaborationId" value={collab.id} />
                <input type="hidden" name="accept" value="false" />
                <Button size="sm" variant="outline" type="submit">
                  {t("collab.decline")}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("collab.credits")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {collab.collaborators.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>
                {m.creator.displayName}{" "}
                <span className="text-muted-foreground">@{m.creator.handle}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{m.sharePct}%</span>
                {m.role === "OWNER" && (
                  <Badge variant="secondary">{t("collab.owner")}</Badge>
                )}
                <Badge
                  variant={
                    m.status === "ACCEPTED"
                      ? "success"
                      : m.status === "INVITED"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {t(`collab.status.${m.status.toLowerCase()}`)}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("collab.invite")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={inviteAction} className="flex gap-2">
                <input type="hidden" name="collaborationId" value={collab.id} />
                <input
                  name="handle"
                  placeholder={t("collab.handlePlaceholder")}
                  className={`flex-1 ${inputCls}`}
                />
                <Button type="submit">{t("collab.sendInvite")}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("collab.shares")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={setSharesAction} className="space-y-2">
                <input type="hidden" name="collaborationId" value={collab.id} />
                {accepted.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">{m.creator.displayName}</span>
                    <div className="flex items-center gap-1">
                      <input
                        name={`share_${m.creatorId}`}
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={m.sharePct}
                        className={`w-20 ${inputCls}`}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span
                    className={
                      shareTotal === 100
                        ? "text-xs text-success"
                        : "text-xs text-destructive"
                    }
                  >
                    {t("collab.total")}: {shareTotal}%
                  </span>
                  <Button size="sm" type="submit">
                    {t("collab.saveShares")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("collab.distribute")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={distributeAction} className="flex items-end gap-2">
                <input type="hidden" name="collaborationId" value={collab.id} />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    name="amount"
                    defaultValue="20"
                    inputMode="decimal"
                    className={`w-full py-2 pl-6 pr-3 ${inputCls.replace("px-3 py-2", "")}`}
                  />
                </div>
                <Button type="submit">{t("collab.distributeBtn")}</Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("collab.distributeHint")}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("collab.notes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(me.status === "ACCEPTED" || isOwner) && (
            <form action={addNoteAction} className="flex gap-2">
              <input type="hidden" name="collaborationId" value={collab.id} />
              <input
                name="body"
                placeholder={t("collab.notePlaceholder")}
                className={`flex-1 ${inputCls}`}
              />
              <Button type="submit">{t("collab.addNote")}</Button>
            </form>
          )}
          {collab.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("collab.noNotes")}</p>
          ) : (
            <ul className="space-y-2">
              {collab.notes.map((n) => (
                <li key={n.id} className="rounded-md border p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author.displayName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
