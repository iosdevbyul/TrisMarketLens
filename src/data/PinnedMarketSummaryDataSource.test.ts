import {describe,expect,it,vi} from "vitest";
import {validPinnedMarketSummary,loadPinnedMarketSummary} from "./PinnedMarketSummaryDataSource";

const base="http://127.0.0.1:8000";
const payload={schemaVersion:"operational_snapshot_summary_v1",evidenceStatus:"unreviewed",
 market:"KOSPI",observationCount:50,tickerCount:5,tradingDayCount:10,
 firstTradingDate:"2026-10-01",lastTradingDate:"2026-10-30"} as const;

describe("Pinned operational snapshot summary",()=>{
 it("fetches read-only unreviewed immutable coverage",async()=>{
  const fetcher=vi.fn(async()=>Response.json(payload));
  const r=await loadPinnedMarketSummary(base,fetcher as typeof fetch);
  expect(r).toEqual({state:"available",data:payload,error:null});
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/operational/summary",
   expect.objectContaining({method:"GET",cache:"no-store"}));
 });
 it("accepts a genuinely empty pinned snapshot without inventing coverage",()=>{
  const empty={...payload,observationCount:0,tickerCount:0,tradingDayCount:0,
   firstTradingDate:null,lastTradingDate:null};
  expect(validPinnedMarketSummary(empty)).toBe(true);
 });
 it("rejects unreviewed-to-reviewed promotion, inconsistent counts and malformed dates",()=>{
  expect(validPinnedMarketSummary({...payload,evidenceStatus:"verified"})).toBe(false);
  expect(validPinnedMarketSummary({...payload,tickerCount:51})).toBe(false);
  expect(validPinnedMarketSummary({...payload,tradingDayCount:51})).toBe(false);
  expect(validPinnedMarketSummary({...payload,lastTradingDate:"2026-02-30"})).toBe(false);
  expect(validPinnedMarketSummary({...payload,firstTradingDate:"2026-12-01"})).toBe(false);
  expect(validPinnedMarketSummary({...payload,observationCount:0})).toBe(false);
 });
 it("rejects remote endpoints without issuing a request",async()=>{
  const fetcher=vi.fn();
  const r=await loadPinnedMarketSummary("https://example.org",fetcher as typeof fetch);
  expect(r.state).toBe("unconfigured");
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("distinguishes optional 503, actual backend failures and bad contracts",async()=>{
  const absent=await loadPinnedMarketSummary(base,(async()=>new Response(null,{status:503})) as typeof fetch);
  const error=await loadPinnedMarketSummary(base,(async()=>new Response(null,{status:500})) as typeof fetch);
  const corrupt=await loadPinnedMarketSummary(base,(async()=>Response.json({...payload,evidenceStatus:"validated"})) as typeof fetch);
  expect(absent.state).toBe("unconfigured");
  expect(error.state).toBe("failed");
  expect(corrupt.state).toBe("failed");
 });
});
