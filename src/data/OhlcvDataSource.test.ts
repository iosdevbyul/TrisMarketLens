import { describe, expect, it, vi } from "vitest";
import { demoOhlcv, loadOhlcv } from "./OhlcvDataSource";
import { isOhlcvSeries } from "../domain/ohlcv";
describe("OHLCV source", () => {
  it("keeps missing data empty", async () => {
    const result = await loadOhlcv("005930");
    expect(result.source).toBe("disconnected");
    expect(result.data.bars).toEqual([]);
  });
  it("provides valid explicitly artificial demo data", () => {
    const demo = demoOhlcv("005930");
    expect(demo.bars.length).toBeGreaterThan(15);
    expect(isOhlcvSeries(demo, "005930")).toBe(true);
  });
  it("rejects invalid candle boundaries and cross ticker responses", () => {
    const demo = demoOhlcv("005930");
    expect(isOhlcvSeries(demo, "000660")).toBe(false);
    expect(isOhlcvSeries({ ...demo, bars: [{ ...demo.bars[0], high: 0 }] }, "005930")).toBe(false);
  });
  it("fetches without cache and preserves ticker", async () => {
    const fetcher = vi.fn(async () => Response.json(demoOhlcv("005930")));
    const result = await loadOhlcv("005930", { mode: "http", apiBaseUrl: "http://localhost:8000/", fetcher: fetcher as typeof fetch });
    expect(result.error).toBeNull();
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/stocks/005930/ohlcv", expect.objectContaining({ cache: "no-store" }));
  });
  it("does not fall back to demo on failed HTTP", async () => {
    const result = await loadOhlcv("005930", { mode: "http", apiBaseUrl: "http://localhost:8000", fetcher: (async () => new Response(null, { status: 404 })) as typeof fetch });
    expect(result.error).toContain("404");
    expect(result.data.bars).toEqual([]);
  });
});
