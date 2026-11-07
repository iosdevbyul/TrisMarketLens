import {describe,expect,it,vi} from "vitest";
import {isHistoricalTickerEvidence,loadHistoricalTickerEvidence} from "./HistoricalPortfolioTickerDataSource";

const reportId="a".repeat(64),ticker="005930",base="http://127.0.0.1:8000";
const envelope={
 schemaVersion:"published_historical_portfolio_v1",researchOnly:true,operationalEligible:false,
 executable:false,pitVerified:false,oosVerified:false,
 investmentSuitabilityVerified:false,brokerageEligible:false
};
function payload(extra:Record<string,unknown>={}){
 return {...envelope,reportId,ticker,modelId:"hgb-research",
  positions:[{position_id:"p-1",ticker,status:"closed",quantity:2,realized_net_pnl:"10"}],
  realizedNetPnl:"10",valuation:null,unavailable:{valuation:"no_final_position_mark"},
  timeline:[{opportunity_id:"o-1",ticker,trading_date:"2025-06-02",action:"HOLD"}],
  total:1,offset:0,limit:10,...extra};
}
describe("published research ticker evidence API contract",()=>{
 it("reads a bounded local-only original ticker projection",async()=>{
  const fetcher=vi.fn(async()=>Response.json(payload()));
  const result=await loadHistoricalTickerEvidence(base,reportId,ticker,0,fetcher as typeof fetch);
  expect(result.data).toEqual(payload());
  expect(fetcher).toHaveBeenCalledWith(
   base+"/api/v1/research/historical-portfolios/"+reportId+"/tickers/"+ticker+"?offset=0&limit=10",
   expect.objectContaining({cache:"no-store",headers:{Accept:"application/json"}})
  );
 });
 it("accepts an empty no-position/no-mark state only with explicit missing-PnL reason",()=>{
  expect(isHistoricalTickerEvidence(payload({
   positions:[],realizedNetPnl:null,valuation:null,
   unavailable:{valuation:"no_final_position_mark",realizedNetPnl:"ticker_realized_pnl_not_recorded"},
   timeline:[],total:0
  }),reportId,ticker,0)).toBe(true);
  expect(isHistoricalTickerEvidence(payload({
   positions:[],realizedNetPnl:null,unavailable:{},timeline:[],total:0
  }),reportId,ticker,0)).toBe(false);
 });
 it("rejects inflated approval, wrong ticker and broken pagination",()=>{
  expect(isHistoricalTickerEvidence(payload({executable:true}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({pitVerified:true}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({ticker:"000660"}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({offset:10}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({total:0}),reportId,ticker,0)).toBe(false);
 });
 it("rejects mismatched timeline entries, invalid dates and unrelated positions",()=>{
  expect(isHistoricalTickerEvidence(payload({timeline:[{ticker:"000660",trading_date:"2025-06-02"}]}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({timeline:[{ticker,trading_date:"2025-02-30"}]}),reportId,ticker,0)).toBe(false);
  expect(isHistoricalTickerEvidence(payload({positions:[{ticker:"000660",position_id:"p",status:"closed"}]}),reportId,ticker,0)).toBe(false);
 });
 it("never issues requests for invalid IDs, tickers, offsets or non-loopback hosts",async()=>{
  const fetcher=vi.fn();
  const args:[string|undefined,string,string,number][]=[
   [base,"bad",ticker,0],[base,reportId,"bad",0],
   [base,reportId,ticker,-1],["https://example.com",reportId,ticker,0],
   [undefined,reportId,ticker,0]
  ];
  for(const [url,id,symbol,offset] of args){
   const result=await loadHistoricalTickerEvidence(url,id,symbol,offset,fetcher as typeof fetch);
   expect(result.data).toBeNull();expect(result.error).toBeTruthy();
  }
  expect(fetcher).not.toHaveBeenCalled();
 });
 it.each([403,404,422,503])("fails closed for HTTP %i",async status=>{
  const result=await loadHistoricalTickerEvidence(base,reportId,ticker,0,(async()=>new Response(null,{status})) as typeof fetch);
  expect(result.data).toBeNull();expect(result.error).toBeTruthy();
 });
 it("rejects malformed JSON, untrusted envelopes and transport errors",async()=>{
  const bad=await loadHistoricalTickerEvidence(base,reportId,ticker,0,(async()=>Response.json(payload({researchOnly:false}))) as typeof fetch);
  const missing=await loadHistoricalTickerEvidence(base,reportId,ticker,0,(async()=>Response.json({})) as typeof fetch);
  const network=await loadHistoricalTickerEvidence(base,reportId,ticker,0,(async()=>{throw Error("offline");}) as typeof fetch);
  for(const result of [bad,missing,network])expect(result.data).toBeNull();
 });
});
