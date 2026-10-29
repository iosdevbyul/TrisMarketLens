import { describe, expect, it } from "vitest";
import { resolveFeatureSourceMode } from "./resolveFeatureSourceMode";

describe("specialized source selection", () => {
  it("connects published features to HTTP when the core source is HTTP", () => {
    expect(resolveFeatureSourceMode(undefined, "http")).toBe("http");
  });
  it("does not turn core mock mode into fake feature records", () => {
    expect(resolveFeatureSourceMode(undefined, "mock")).toBe("disconnected");
    expect(resolveFeatureSourceMode(undefined, undefined)).toBe("disconnected");
  });
  it("honors explicit disconnected and mock overrides", () => {
    expect(resolveFeatureSourceMode("disconnected", "http")).toBe("disconnected");
    expect(resolveFeatureSourceMode("mock", "http")).toBe("mock");
  });
  it("does not rewrite invalid modes into trusted HTTP or mock", () => {
    expect(resolveFeatureSourceMode("invalid", "http")).toBe("invalid");
  });
});
