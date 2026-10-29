import { describe, expect, it } from "vitest";
import { getFeatureDataState } from "./featureDataState";
describe("feature data presentation states", () => {
  it("distinguishes disconnected, empty, and available responses", () => {
    expect(getFeatureDataState("disconnected", null, 0)).toBe("disconnected");
    expect(getFeatureDataState("http", null, 0)).toBe("empty");
    expect(getFeatureDataState("http", null, 3)).toBe("available");
  });
  it("prioritizes errors over misleading empty and demo labels", () => {
    expect(getFeatureDataState("http", "API unavailable", 0)).toBe("error");
    expect(getFeatureDataState("mock", "API unavailable", 3)).toBe("error");
  });
  it("identifies explicit demonstration mode", () => {
    expect(getFeatureDataState("mock", null, 2)).toBe("demo");
  });
});
