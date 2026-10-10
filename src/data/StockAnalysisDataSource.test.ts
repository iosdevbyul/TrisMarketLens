import { describe, expect, it, vi } from "vitest";
import { demoStockAnalysis, loadStockAnalysis } from "./StockAnalysisDataSource";
import { isStockAnalysisSnapshot } from "../domain/stockAnalysis";
describe("Stock analysis read-only adapter", () => {
  it("defaults to no predictions", async () => {
    const r = await loadStockAnalysis("005930");
    expect(r.data.records).toEqual([]);
    expect(r.source).toBe("disconnected");
  });
  it("distinguishes demo records from real analysis", async () => {
    const r = await loadStockAnalysis("005930", { mode: "mock" });
    expect(r.source).toBe("mock");
    expect(r.data.records[0].modelId).toBe("EXAMPLE-MODEL");
  });
  it("loads the requested ticker without caching", async () => {
    const fetcher = vi.fn(async () => Response.json(demoStockAnalysis("005930")));
    const r = await loadStockAnalysis("005930", { mode: "http", apiBaseUrl: "http://localhost:8000/", fetcher: fetcher as typeof fetch });
    expect(r.error).toBeNull();
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/stocks/005930/analysis", expect.objectContaining({ cache: "no-store" }));
  });
  it("rejects cross-ticker results and invalid scores", () => {
    const snapshot = demoStockAnalysis("005930");
    expect(isStockAnalysisSnapshot(snapshot, "000660")).toBe(false);
    expect(isStockAnalysisSnapshot({ ...snapshot, records: [{ ...snapshot.records[0], score: 1.7 }] }, "005930")).toBe(false);
  });
  it("does not fallback to fabricated data on HTTP error", async () => {
    const r = await loadStockAnalysis("005930", { mode: "http", apiBaseUrl: "http://localhost:8000", fetcher: (async () => new Response(null, { status: 503 })) as typeof fetch });
    expect(r.data.records).toEqual([]);
    expect(r.error).toContain("503");
  });
});
