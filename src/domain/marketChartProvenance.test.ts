import {describe,expect,it} from "vitest";
import {chartPeriodStart,filterOhlcvPeriod,chartAnalysesForSource} from "./marketChartProvenance";
import type {OhlcvBar} from "./ohlcv";
const bar=(date:string):OhlcvBar=>({date,open:100,high:110,low:90,close:105,volume:5});
describe("market chart provenance and date range",()=>{
 it("clamps end-of-month and leap-year UTC boundaries instead of overflowing into March",()=>{
  expect(chartPeriodStart("2026-03-31","1M")).toBe("2026-02-28");
  expect(chartPeriodStart("2024-03-31","1M")).toBe("2024-02-29");
  expect(chartPeriodStart("2026-05-31","3M")).toBe("2026-02-28");
  expect(chartPeriodStart("2026-01-31","1M")).toBe("2025-12-31");
  expect(chartPeriodStart("2024-02-29","1Y")).toBe("2023-02-28");
 });
 it("preserves original date, OHLC and volume values when filtering chart ranges",()=>{
  const bars=[bar("2026-02-27"),bar("2026-02-28"),bar("2026-03-02"),bar("2026-03-31")];
  expect(filterOhlcvPeriod(bars,"1M")).toEqual(bars.slice(1));
  expect(filterOhlcvPeriod([], "1M")).toEqual([]);
  expect(bars[0].open).toBe(100);
 });
 it("never paints demo signals over live-price observations or vice versa",()=>{
  expect(chartAnalysesForSource("http","mock",null)).toBe(false);
  expect(chartAnalysesForSource("mock","http",null)).toBe(false);
  expect(chartAnalysesForSource("http","disconnected",null)).toBe(false);
  expect(chartAnalysesForSource("http","http","HTTP 503")).toBe(false);
  expect(chartAnalysesForSource("http","http",null)).toBe(true);
  expect(chartAnalysesForSource("mock","mock",null)).toBe(true);
 });
});
