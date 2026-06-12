import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Translate = (key: string) => string;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// AI-generated content disclosure shown on the public watch page (EU AI Act
// Art. 50 framing). Reads pipeline snapshots, falling back to the Video fields
// for seeded content that predates the pipeline.
export function ProvenancePanel({
  aiModel,
  generator,
  hasCredentials,
  t,
}: {
  aiModel: string | null;
  generator: string | null;
  hasCredentials: boolean;
  t: Translate;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("provenance.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label={t("provenance.model")} value={aiModel ?? "—"} />
        <Row
          label={t("provenance.generator")}
          value={generator ?? aiModel ?? "—"}
        />
        <Row
          label={t("provenance.credentials")}
          value={
            hasCredentials
              ? t("provenance.credentialsYes")
              : t("provenance.credentialsNo")
          }
        />
        <p className="pt-2 text-xs text-muted-foreground">
          {t("provenance.disclosureBody")}
        </p>
      </CardContent>
    </Card>
  );
}
