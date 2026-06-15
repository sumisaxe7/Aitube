import { describe, expect, it } from "vitest";

import { getFileSizeLimit } from "@/lib/upload-limit";

describe("getFileSizeLimit", () => {
  it("uses the configured byte limit when provided", () => {
    expect(getFileSizeLimit("104857600")).toBe(104857600);
  });

  it("falls back to 200MB when the value is invalid", () => {
    expect(getFileSizeLimit("bad-value")).toBe(200 * 1024 * 1024);
    expect(getFileSizeLimit("0")).toBe(200 * 1024 * 1024);
  });
});
