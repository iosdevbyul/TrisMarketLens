import {describe,expect,it,vi} from "vitest";
import {isPublishedPortfolioPage,loadPublishedPortfolios} from "./HistoricalPortfolioDataSource";
const base="http://127.0.0.1:8000";
const item={
 reportId:"a".repeat(64),modelFamily:"linear",tickers:["005930","000660","035420","051910","068270"],
 publishedAt:"2026-10-30T12:00:00Z",initialVirtualCash:"1000000",period:{start:"2025-01-01",end:"2025-06-30"},
 evidenceScope:"synthetic_research",portfolioValuationAvailable:false,
 archiveVerification:"integrity_verified",reportVerification:"offline_authoritative_replay_passed",
 researchOnly:true,operationalEligible:false,executable:false,pitVerified:false,oosVerified:false,
 investmentSuitabilityVerified:false,brokerageEligible:false,
} as const;
const page=(overrides:Record<string,unknown>={})=>({
 schemaVersion:"published_historical_portfolio_v1",researchOnly:true,
 operationalEligible:false,executable:false,pitVerified:false,oosVerified:false,
 investmentSuitabilityVerified:false,brokerageEligible:false,
 items:[item],total:1,offset:0,limit:10,...overrides
});
describe("DonghakStockVision published portfolio read-only adapter",()=>{
 it("reads the exact local-only publication endpoint without writes or cached data",async()=>{
  const fetcher=vi.fn(async()=>Response.json(page()));
  const result=await loadPublishedPortfolios(base,0,fetcher as typeof fetch);
  expect(result.data).toEqual(page());
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/research/historical-portfolios?offset=0&limit=10",
   expect.objectContaining({cache:"no-store",headers:{Accept:"application/json"}}));
  expect(result.error).toBeNull();
 });
 it("accepts an explicitly empty publication archive",()=>{
  expect(isPublishedPortfolioPage(page({items:[],total:0}),0,10)).toBe(true);
 });
 it.each([
  ["unsafe research approval",{...item,executable:true}],
  ["missing publication verification",{...item,archiveVerification:"missing"}],
  ["invalid report ID",{...item,reportId:"unsafe"}],
  ["duplicate tickers",{...item,tickers:["005930","005930","035420","051910","068270"]}],
 ])("rejects %s",async(_reason,bad)=>{
  const fetcher=vi.fn(async()=>Response.json(page({items:[bad]})));
  const result=await loadPublishedPortfolios(base,0,fetcher as typeof fetch);
  expect(result.data).toBeNull();
  expect(result.error).toContain("contract");
 });
 it("rejects mismatched page counters and duplicate reports",()=>{
  expect(isPublishedPortfolioPage(page({offset:10}),0,10)).toBe(false);
  expect(isPublishedPortfolioPage(page({items:[item,item],total:2}),0,10)).toBe(false);
  expect(isPublishedPortfolioPage(page({items:[item],total:0}),0,10)).toBe(false);
 });
 it("never calls remote or unconfigured backends",async()=>{
  const fetcher=vi.fn();
  for(const url of [undefined,"https://example.com","http://example.com","http://192.168.1.7:8000"]){
   const result=await loadPublishedPortfolios(url,0,fetcher as typeof fetch);
   expect(result.unavailable).toBe(true);
  }
  expect(fetcher).not.toHaveBeenCalled();
 });
 it.each([403,404,503,500])("fails closed for HTTP %i",async(status)=>{
  const result=await loadPublishedPortfolios(base,0,(async()=>new Response(null,{status})) as typeof fetch);
  expect(result.data).toBeNull();expect(result.unavailable).toBe(true);
 });
 it("fails closed for malformed JSON and transport exceptions",async()=>{
  const invalid=await loadPublishedPortfolios(base,0,(async()=>Response.json({})) as typeof fetch);
  const failed=await loadPublishedPortfolios(base,0,(async()=>{throw Error("offline")}) as typeof fetch);
  expect(invalid.data).toBeNull();expect(failed.data).toBeNull();
 });
});
