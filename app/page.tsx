import { recommender } from "@/lib/services";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";
import { HomeFeed } from "@/components/home-feed";
import type { ResolvedSection } from "@/lib/types/feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = DEFAULT_LOCALE;
  const t = getTranslator(locale);
  const sections = await recommender.getHomeFeed({ locale });

  const resolved: ResolvedSection[] = sections.map((s) => ({
    id: s.id,
    title: s.genreLabel ?? (s.titleKey ? t(s.titleKey) : ""),
    genre: s.genre,
    items: s.items,
  }));

  const labels = {
    aiVerified: t("badge.aiVerified"),
    aiVerifiedTitle: t("badge.aiVerifiedTitle"),
    noRatings: t("video.noRatings"),
  };

  const spotlight = sections
    .flatMap((s) => s.items)
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 5);

  return <HomeFeed sections={resolved} spotlight={spotlight} labels={labels} />;
}
