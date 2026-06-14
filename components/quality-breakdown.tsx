import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QualityResult } from "@/lib/quality";

type Translate = (key: string) => string;

const DIMS: Array<{ key: keyof QualityResult["dimensions"]; labelKey: string }> = [
  { key: "visual", labelKey: "rate.visual" },
  { key: "narrative", labelKey: "rate.narrative" },
  { key: "audio", labelKey: "rate.audio" },
];

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-muted">
      <div
        className="h-full bg-primary"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  );
}

export function QualityBreakdown({
  quality,
  t,
}: {
  quality: QualityResult;
  t: Translate;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("quality.title")}</CardTitle>
        {quality.rated ? (
          <div className="text-end">
            <div className="text-2xl font-bold leading-none">
              {quality.score.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                {t("quality.outOf")}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {quality.ratingCount} {t("video.ratings")}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("video.noRatings")}
          </span>
        )}
      </CardHeader>
      {quality.rated && (
        <CardContent className="space-y-3">
          {DIMS.map(({ key, labelKey }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{t(labelKey)}</span>
                <span className="font-medium">
                  {quality.dimensions[key].toFixed(2)}
                </span>
              </div>
              <Bar value={quality.dimensions[key]} />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
