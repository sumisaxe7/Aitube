import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { getCreatorMonetization } from "@/lib/monetization";
import { creatorSharePct } from "@/lib/revenue";
import { PriceForm } from "@/components/price-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function MonetizationPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");

  const t = getTranslator(DEFAULT_LOCALE);
  const mon = await getCreatorMonetization(creator.id);
  const keepPct = creatorSharePct();
  const q = mon.qualification;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("monetize.title")}
        </h1>
        <Link
          href={`/creator/${creator.handle}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("monetize.viewPublic")}
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-3xl font-bold text-success">
            {t("monetize.youKeep")} {keepPct}%
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("monetize.youKeepBlurb")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {t("monetize.qualification")}
          </CardTitle>
          <Badge variant={q.qualified ? "success" : "outline"}>
            {q.qualified ? t("monetize.qualified") : t("monetize.notQualified")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>
              {t("monetize.reqVideos")} (≥ {q.rule.minPublishedVideos})
            </span>
            <span className={q.meetsVideoCount ? "text-success" : "text-muted-foreground"}>
              {q.publishedVideoCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              {t("monetize.reqQuality")} (≥ {q.rule.minQualityScore})
            </span>
            <span className={q.meetsQuality ? "text-success" : "text-muted-foreground"}>
              {q.topQualityScore.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("monetize.priceTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {q.qualified ? (
            <PriceForm initialCents={mon.subscriptionPriceCents} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("monetize.lockedHint")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("monetize.earnings")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Stat
            label={t("monetize.net")}
            value={formatUsd(mon.earnings.netCents)}
          />
          <Stat
            label={t("monetize.gross")}
            value={formatUsd(mon.earnings.grossCents)}
          />
          <Stat
            label={t("monetize.fee")}
            value={formatUsd(mon.earnings.platformFeeCents)}
          />
          <Stat
            label={t("monetize.subscribers")}
            value={String(mon.activeSubscribers)}
          />
          <Stat
            label={t("monetize.subs")}
            value={String(mon.earnings.subscriptionCount)}
          />
          <Stat
            label={t("monetize.tips")}
            value={String(mon.earnings.tipCount)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
