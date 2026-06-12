import { describe, expect, it } from "vitest";

import { selectProvider } from "@/lib/services/factory";
import { aiCheck, moderation, provenance, video, payments } from "@/lib/services";

describe("service provider factory", () => {
  it("defaults to the mock implementation when the env var is unset", () => {
    const impl = selectProvider<string>("DEFINITELY_UNSET_PROVIDER_XYZ", {
      mock: () => "mock-impl",
    });
    expect(impl).toBe("mock-impl");
  });

  it("lists available providers when the requested one is missing", () => {
    process.env.TMP_PROVIDER_TEST = "real";
    expect(() =>
      selectProvider("TMP_PROVIDER_TEST", { mock: () => 1 }),
    ).toThrow(/Unknown provider "real".*Available: mock/);
    delete process.env.TMP_PROVIDER_TEST;
  });
});

describe("mock service shapes (no DB required)", () => {
  it("aiCheck.analyze returns a confident AI verdict", async () => {
    const res = await aiCheck.analyze({ videoId: "v1" });
    expect(res.isAiGenerated).toBe(true);
    expect(res.confidence).toBeGreaterThan(0);
    expect(res.confidence).toBeLessThanOrEqual(1);
    expect(typeof res.detectedModel).toBe("string");
    expect(res.provider).toBe("mock");
  });

  it("moderation.scan returns a clean verdict (no top category) by default", async () => {
    const res = await moderation.scan({ videoId: "v1" });
    expect(res.decision).toBe("clean");
    expect(res.topCategory).toBeNull();
    expect(res.categories.length).toBeGreaterThan(0);
  });

  it("moderation deepfake check is its own call: false by default, forceable to true", async () => {
    const clean = await moderation.checkRealPersonDeepfake({ videoId: "v1" });
    expect(clean.realPersonDeepfake).toBe(false);
    expect(clean.matchedIdentity).toBeNull();

    const flagged = await moderation.checkRealPersonDeepfake({ simulate: "deepfake" });
    expect(flagged.realPersonDeepfake).toBe(true);
    expect(flagged.matchedIdentity).toBeTruthy();
  });

  it("provenance.read returns C2PA credentials with a generator", async () => {
    const res = await provenance.read({ videoId: "v1" });
    expect(res.hasCredentials).toBe(true);
    expect(res.generator).toBeTruthy();
    expect(Array.isArray(res.c2pa)).toBe(true);
  });

  it("video service returns Mux-shaped ids and a playback url", async () => {
    const upload = await video.createUpload();
    expect(upload.assetId).toMatch(/^asset_/);
    const status = await video.getTranscodeStatus(upload.assetId);
    expect(status.status).toBe("ready");
    expect(status.playbackId).toBeTruthy();
    expect(video.getPlaybackUrl(status.playbackId!)).toContain(".m3u8");
  });

  it("payments split is conservation-of-money: net + fee === gross", async () => {
    const res = await payments.createTip({
      creatorId: "c1",
      fromUserId: "u1",
      amountCents: 1000,
    });
    expect(res.grossCents).toBe(1000);
    expect(res.netCents + res.platformFeeCents).toBe(res.grossCents);
    expect(res.platformFeeCents).toBeLessThan(res.grossCents * 0.3); // beats YouTube
  });
});
