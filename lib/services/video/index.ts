import { selectProvider } from "../factory";
import type { VideoService } from "./types";
import { mockVideo } from "./mock";
import { muxVideo } from "./mux";

export * from "./types";

export const video = selectProvider<VideoService>("VIDEO_PROVIDER", {
  mock: () => mockVideo,
  mux: () => muxVideo,
});
