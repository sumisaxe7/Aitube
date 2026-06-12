import { selectProvider } from "../factory";
import type { VideoService } from "./types";
import { mockVideo } from "./mock";

export * from "./types";

export const video = selectProvider<VideoService>("VIDEO_PROVIDER", {
  mock: () => mockVideo,
});
