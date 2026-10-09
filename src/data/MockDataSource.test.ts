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
    expect(models.find((model) => model.direction === "Up")?.modelName).toBe("HGB-7");
    expect(models.find((model) => model.direction === "Down")?.oosAveragePrecision).toBe(
      0.442473,
    );
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
