import { VideoCard } from "@/components/video-card";
import type { FeedSection } from "@/lib/services";
import type { VideoLabels } from "@/lib/types/feed";

type Translate = (key: string) => string;

export function VideoRow({
  section,
  t,
}: {
  section: FeedSection;
  t: Translate;
}) {
  if (section.items.length === 0) return null;
  const labels: VideoLabels = {
    aiVerified: t("badge.aiVerified"),
    aiVerifiedTitle: t("badge.aiVerifiedTitle"),
    noRatings: t("video.noRatings"),
  };
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight gradient-text">
        {section.genreLabel ?? (section.titleKey ? t(section.titleKey) : "")}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {section.items.map((video) => (
          <VideoCard key={video.id} video={video} labels={labels} />
        ))}
      </div>
    </section>
  );
}
