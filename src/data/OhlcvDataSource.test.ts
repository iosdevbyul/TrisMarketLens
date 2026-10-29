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

describe("original KRX OHLCV contract", () => {
  const bar = {date:"2026-10-28",open:71000,high:72000,low:70500,close:71500,volume:150000};
  it("accepts integer-valued raw KRX prices and zero-volume no-trade observations", () => {
    expect(isOhlcvSeries({ticker:"005930",bars:[bar,{date:"2026-10-29",open:0,high:0,low:0,close:71500,volume:0}]},"005930")).toBe(true);
  });
  it("rejects calendar-impossible dates and fractional KRX prices", () => {
    expect(isOhlcvSeries({ticker:"005930",bars:[{...bar,date:"2026-02-30"}]},"005930")).toBe(false);
    expect(isOhlcvSeries({ticker:"005930",bars:[{...bar,close:71500.5}]},"005930")).toBe(false);
  });
  it("rejects duplicate days, fractional volume and inconsistent raw candle bounds", () => {
    expect(isOhlcvSeries({ticker:"005930",bars:[bar,bar]},"005930")).toBe(false);
    expect(isOhlcvSeries({ticker:"005930",bars:[{...bar,volume:0.5}]},"005930")).toBe(false);
    expect(isOhlcvSeries({ticker:"005930",bars:[{...bar,low:73000}]},"005930")).toBe(false);
  });
  it("preserves raw no-trade records in HTTP mode without synthetic repairs", async () => {
    const raw = {ticker:"005930",bars:[{...bar,open:0,high:0,low:0,volume:0}]};
    const result = await loadOhlcv("005930",{mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(raw)) as typeof fetch});
    expect(result.error).toBeNull();
    expect(result.data).toEqual(raw);
  });
});
