import { describe, expect, it } from "vitest";

import { mockDataSource } from "./MockDataSource";

describe("MockDataSource", () => {
  it("exposes the approved universe and keeps the baseline run locked", async () => {
    const status = await mockDataSource.getProjectStatus();

    expect(status.metrics.find((metric) => metric.label === "Universe")?.value).toBe("993");
    expect(status.baseline.find((item) => item.label === "Historical backtest")?.state).toBe(
      "not_started",
    );
  });

  it("marks the official exchange calendar as verified", async () => {
    const status = await mockDataSource.getProjectStatus();

    expect(status.evidence.find((item) => item.label === "Exchange calendar")?.state).toBe(
      "verified",
    );
  });
});
