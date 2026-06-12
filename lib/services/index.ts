// Barrel — callers do `import { recommender, aiCheck, ... } from "@/lib/services"`.
// Each re-exported instance is the env-selected implementation (default: mock).
export * from "./simulate";
export * from "./aiCheck";
export * from "./moderation";
export * from "./provenance";
export * from "./video";
export * from "./payments";
export * from "./recommender";
export * from "./helpBot";
