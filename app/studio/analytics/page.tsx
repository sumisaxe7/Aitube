import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { getCreatorAnalytics } from "@/lib/analytics/dashboard";
import { HBars, DropOffChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

function hours(sec: number) {
  return `${(sec / 3600).toFixed(1)}h`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const a = await getCreatorAnalytics(creator.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("analytics.title")}
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label={t("analytics.views")} value={String(a.totals.views)} />
        <Metric label={t("analytics.watchTime")} value={hours(a.totals.watchTimeSec)} />
        <Metric label={t("analytics.completes")} value={String(a.totals.completes)} />
        <Metric label={t("analytics.revenue")} value={formatUsd(a.revenue.netCents)} />
      </div>

      {a.geography.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.geography")}</CardTitle>
          </CardHeader>
          <CardContent>
            <HBars
              items={a.geography.slice(0, 8).map((g) => ({
                label: g.country,
                value: g.views,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("analytics.perVideo")}</h2>
        {a.videos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("analytics.empty")}
            </CardContent>
          </Card>
        )}
        {a.videos.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle className="text-base">{v.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold">{v.views}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("analytics.views")}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{hours(v.watchTimeSec)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("analytics.watchTime")}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">
                      {Math.round(v.completionRate * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("analytics.completion")}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {t("analytics.dropOff")}
                  </div>
                  <DropOffChart data={v.dropOff} />
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs text-muted-foreground">
                  {t("analytics.ratingBreakdown")}
                </div>
                {v.quality.rated ? (
                  <HBars
                    items={[
                      {
                        label: t("rate.visual"),
                        value: v.quality.dimensions.visual,
                        display: v.quality.dimensions.visual.toFixed(2),
                      },
                      {
                        label: t("rate.narrative"),
                        value: v.quality.dimensions.narrative,
                        display: v.quality.dimensions.narrative.toFixed(2),
                      },
                      {
                        label: t("rate.audio"),
                        value: v.quality.dimensions.audio,
                        display: v.quality.dimensions.audio.toFixed(2),
                      },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("video.noRatings")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
