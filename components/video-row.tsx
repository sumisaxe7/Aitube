import { VideoCard } from "@/components/video-card";
import type { FeedSection } from "@/lib/services";

type Translate = (key: string) => string;

export function VideoRow({
  section,
  t,
}: {
  section: FeedSection;
  t: Translate;
}) {
  if (section.items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">{t(section.titleKey)}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {section.items.map((video) => (
          <VideoCard key={video.id} video={video} t={t} />
        ))}
      </div>
    </section>
  );
}
