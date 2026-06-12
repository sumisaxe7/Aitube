import { recommender } from "@/lib/services";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { VideoRow } from "@/components/video-row";

// SSR per request — the home feed reads seeded data through the recommender mock.
// force-dynamic keeps the DB out of the build step (so `next build` needs no DB).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = DEFAULT_LOCALE;
  const t = getTranslator(locale);
  const sections = await recommender.getHomeFeed({ locale });
  const hasContent = sections.some((section) => section.items.length > 0);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border bg-card p-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t("home.heroSubtitle")}
        </p>
      </section>

      {hasContent ? (
        sections.map((section) => (
          <VideoRow key={section.id} section={section} t={t} />
        ))
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="text-lg font-semibold">{t("home.emptyTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("home.emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
