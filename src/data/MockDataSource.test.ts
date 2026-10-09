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

  it("keeps unresolved lifecycle evidence visible instead of hiding it", async () => {
    const coverage = await mockDataSource.getCoverageSummary();

    expect(coverage.unresolvedSecurities).toBe(43);
    expect(coverage.unexplainedTickerSessions).toBe(8_118);
    expect(coverage.historicalIdentityVerified).toBe(0);
  });

  it("exposes model qualification metrics without inventing backtest performance", async () => {
    const models = await mockDataSource.getModelSummaries();

    expect(models).toHaveLength(2);
    expect(models.find((model) => model.id === "up")?.modelName).toBe("HGB-7");
    expect(models.find((model) => model.id === "down")?.oosAveragePrecision).toBe(
      0.442473,
    );
  });

  it("keeps the Up model executable and the Down model research-only", async () => {
    const up = await mockDataSource.getModel("up");
    const down = await mockDataSource.getModel("down");

    expect(up?.role).toBe("baseline_executable");
    expect(up?.provenance.maxLeafNodes).toBe(7);
    expect(up?.oos.averagePrecision).toBe(0.369409);

    expect(down?.role).toBe("research_only");
    expect(down?.provenance.maxLeafNodes).toBe(15);
    expect(down?.oos.averagePrecision).toBe(0.442473);
  });

  it("exposes evidence layers with scope-specific states", async () => {
    const layers = await mockDataSource.getEvidenceLayers();

    expect(layers).toHaveLength(5);
    expect(layers.find((layer) => layer.id === "calendar")?.state).toBe("verified");
    expect(layers.find((layer) => layer.id === "security-lifecycle")?.state).toBe(
      "in_progress",
    );
    expect(layers.find((layer) => layer.id === "corporate-actions")?.state).toBe(
      "blocked",
    );
  });

  it("keeps calendar verification separate from lifecycle blockers", async () => {
    const calendar = await mockDataSource.getEvidenceLayer("calendar");
    const lifecycle = await mockDataSource.getEvidenceLayer("security-lifecycle");

    expect(calendar?.metrics.find((metric) => metric.label === "Trading sessions")?.value).toBe(
      "283",
    );
    expect(calendar?.blocker).toBeNull();

    expect(
      lifecycle?.metrics.find((metric) => metric.label === "Unexplained sessions")?.value,
    ).toBe("8,118");
    expect(lifecycle?.blocker).toContain("43 securities");
  });

  it("does not equate current DART mapping with historical identity coverage", async () => {
    const dart = await mockDataSource.getEvidenceLayer("dart");
    const corporateActions = await mockDataSource.getEvidenceLayer("corporate-actions");

    expect(dart?.metrics.find((metric) => metric.label === "Current mapping")?.value).toBe(
      "871 / 993",
    );
    expect(
      corporateActions?.metrics.find((metric) => metric.label === "Historical identity")
        ?.value,
    ).toBe("0 / 993");
  });

  it("returns searchable stock summaries and explicit mock-only details", async () => {
    const stocks = await mockDataSource.getStocks();
    const samsung = await mockDataSource.getStock("005930");

    expect(stocks.some((stock) => stock.ticker === "005930")).toBe(true);
    expect(samsung?.dataStatus).toBe("mock");
    expect(samsung?.chartNote).toContain("No price values are fabricated");
  });

  it("returns null for a stock outside the mock explorer", async () => {
    await expect(mockDataSource.getStock("999999")).resolves.toBeNull();
  });
});
