import {describe,expect,it,vi} from "vitest";
import {
 isHistoricalPortfolioSummary,isHistoricalTradesPage,
 loadHistoricalPortfolioSummary,loadHistoricalPortfolioTrades
} from "./HistoricalPortfolioDetailDataSource";

const id="a".repeat(64),base="http://127.0.0.1:8000";
const envelope={
 schemaVersion:"published_historical_portfolio_v1",researchOnly:true,operationalEligible:false,
 executable:false,pitVerified:false,oosVerified:false,investmentSuitabilityVerified:false,
 brokerageEligible:false
};
const summary=()=>({
 ...envelope,reportId:id,resultSchemaVersion:"five_ticker_historical_result_v1",
 reportSchemaVersion:"five_ticker_historical_report_v1",modelFamily:"linear",modelId:"research-model",
 publishedAt:"2026-11-01T00:00:00Z",
 tickers:["005930","000660","035420","051910","068270"],
 period:{start:"2025-01-01",end:"2025-06-30"},evidenceScope:"synthetic_research",
 dataOrigin:"synthetic",portfolioValuationAvailable:false,
 archiveVerification:"integrity_verified",reportVerification:"offline_authoritative_replay_passed",
 initialVirtualCash:"1000000",finalTotalCash:"995000",availableCash:"995000",
 reservedCash:"0",realizedNetPnl:"-5000",finalPortfolioEquity:null,unrealizedPnl:null,
 portfolioReturn:null,decisionCount:4,acceptedOrderCount:1,fillCount:0,
 completedPositionCount:0,pendingOrderCount:1,limitations:["No PIT approval"],
 unavailable:{portfolioReturn:"valuation_evidence_unavailable"}
});
const trade={eventId:"b".repeat(64),classification:"no_order",terminalStatus:null,
 evidence:{ticker:"005930",trading_date:"2025-06-02"}};
const trades=(overrides:Record<string,unknown>={})=>({
 ...envelope,reportId:id,items:[trade],total:1,offset:0,limit:10,...overrides
});

describe("Published historical portfolio detail",()=>{
 it("accepts an actual backend-shaped research-only summary with unavailable valuation",async()=>{
  const fetcher=vi.fn(async()=>Response.json(summary()));
  const value=await loadHistoricalPortfolioSummary(base,id,fetcher as typeof fetch);
  expect(value.data).toEqual(summary());
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/research/historical-portfolios/"+id,
   expect.objectContaining({cache:"no-store",headers:{Accept:"application/json"}}));
 });
 it("rejects fabricated approval, unsupported schema, invalid valuation and wrong IDs",()=>{
  expect(isHistoricalPortfolioSummary({...summary(),executable:true},id)).toBe(false);
  expect(isHistoricalPortfolioSummary({...summary(),pitVerified:true},id)).toBe(false);
  expect(isHistoricalPortfolioSummary({...summary(),portfolioReturn:"bogus"},id)).toBe(false);
  expect(isHistoricalPortfolioSummary({...summary(),reportId:"other"},id)).toBe(false);
  expect(isHistoricalPortfolioSummary({...summary(),reportVerification:"none"},id)).toBe(false);
 });
 it("accepts no-trade classifications and rejects malformed pagination and event evidence",()=>{
  expect(isHistoricalTradesPage(trades(),id,0)).toBe(true);
  expect(isHistoricalTradesPage(trades({items:[],total:0}),id,0)).toBe(true);
  expect(isHistoricalTradesPage(trades({offset:10}),id,0)).toBe(false);
  expect(isHistoricalTradesPage(trades({items:[trade,trade],total:2}),id,0)).toBe(false);
  expect(isHistoricalTradesPage(trades({items:[{...trade,classification:"live_order"}]}),id,0)).toBe(false);
  expect(isHistoricalTradesPage(trades({items:[{...trade,evidence:{ticker:"005930",trading_date:"unknown"}}]}),id,0)).toBe(false);
 });
 it("reads bounded trade evidence without triggering publication or trading",async()=>{
  const fetcher=vi.fn(async()=>Response.json(trades()));
  const result=await loadHistoricalPortfolioTrades(base,id,0,fetcher as typeof fetch);
  expect(result.data?.items[0].classification).toBe("no_order");
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/research/historical-portfolios/"+id+"/trades?offset=0&limit=10",
   expect.objectContaining({cache:"no-store"}));
 });
 it("fails closed before network for bad report ids, offsets and non-local backends",async()=>{
  const fetcher=vi.fn();
  expect((await loadHistoricalPortfolioSummary(base,"../../etc",fetcher as typeof fetch)).data).toBeNull();
  expect((await loadHistoricalPortfolioSummary("https://example.org",id,fetcher as typeof fetch)).data).toBeNull();
  expect((await loadHistoricalPortfolioTrades(base,id,-1,fetcher as typeof fetch)).data).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
 });
 it.each([403,404,503,500])("shows unavailable HTTP %i without synthetic fallback",async status=>{
  const result=await loadHistoricalPortfolioSummary(base,id,(async()=>new Response(null,{status})) as typeof fetch);
  expect(result.data).toBeNull();
  expect(result.error).toBeTruthy();
 });
 it("treats JSON and transport errors as unavailable",async()=>{
  expect((await loadHistoricalPortfolioTrades(base,id,0,(async()=>Response.json({})) as typeof fetch)).data).toBeNull();
  expect((await loadHistoricalPortfolioTrades(base,id,0,(async()=>{throw Error("offline");}) as typeof fetch)).data).toBeNull();
 });
});