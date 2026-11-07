import {describe,expect,it,vi} from "vitest";
import {
 comparePublishedHistoricalPortfolios,validComparisonSelection,validHistoricalComparison
} from "./HistoricalPortfolioComparisonDataSource";

const idA="a".repeat(64),idB="b".repeat(64);
const base="http://127.0.0.1:8000";
const envelope={
 researchOnly:true,operationalEligible:false,executable:false,pitVerified:false,
 oosVerified:false,investmentSuitabilityVerified:false,brokerageEligible:false
};
const summary=(id:string)=>({
 ...envelope,schemaVersion:"published_historical_portfolio_v1",
 reportId:id,resultSchemaVersion:"five_ticker_historical_result_v1",
 reportSchemaVersion:"five_ticker_historical_report_v1",modelFamily:"linear",
 modelId:"research-model",publishedAt:"2026-11-01T00:00:00Z",
 tickers:["005930","000660","035420","051910","068270"],
 period:{start:"2025-01-01",end:"2025-06-30"},evidenceScope:"synthetic_research",
 dataOrigin:"synthetic",portfolioValuationAvailable:false,
 archiveVerification:"integrity_verified",reportVerification:"offline_authoritative_replay_passed",
 initialVirtualCash:"1000000",finalTotalCash:"995000",availableCash:"995000",
 reservedCash:"0",realizedNetPnl:"-5000",finalPortfolioEquity:null,
 unrealizedPnl:null,portfolioReturn:null,decisionCount:4,acceptedOrderCount:1,
 fillCount:0,completedPositionCount:0,pendingOrderCount:1,
 limitations:["No PIT approval"],unavailable:{portfolioReturn:"valuation_evidence_unavailable"},
 tickerCount:5,signalEvidenceScopes:["controlled_mechanics_test_double"],
 valuationBasis:{timestamp:null,stage:null,observedMarkFields:null,policy:null,
 unavailable:{policy:"valuation_policy_not_in_published_projection",timestamp:"valuation_source_field_unavailable"}}
});
const comparison=(overrides:Record<string,unknown>={})=>({
 ...envelope,schemaVersion:"historical_portfolio_comparison_v1",
 items:[summary(idA),summary(idB)],
 comparability:{
  periodsDiffer:false,valuationTimestampsDiffer:null,observedMarkFieldsDiffer:null,
  valuationPolicyComparison:"unavailable",
  unavailable:{valuationPolicyComparison:"valuation_policy_not_in_published_projection"},
  notices:["no_ranking_or_recommendation","valuation_policy_not_in_published_projection"]
 },...overrides
});

describe("read-only historical portfolio comparison",()=>{
 it("sends exactly 2 selected IDs to the local backend comparison route",async()=>{
  const fetcher=vi.fn(async()=>Response.json(comparison()));
  const result=await comparePublishedHistoricalPortfolios(base,[idA,idB],fetcher as typeof fetch);
  expect(result.error).toBeNull();
  expect(result.data?.items).toHaveLength(2);
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/research/historical-portfolios/compare",
   expect.objectContaining({
    method:"POST",
    cache:"no-store",
    headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({reportIds:[idA,idB]})
   }));
 });
 it("accepts missing valuation comparability without synthesizing returns",()=>{
  expect(validHistoricalComparison(comparison(),[idA,idB])).toBe(true);
 });
 it("rejects malformed, duplicate, and out-of-range selections before contacting the backend",async()=>{
  const fetcher=vi.fn();
  const invalid=[[],[idA],[idA,idA],[idA,"unsafe"],Array(6).fill(idA)];
  for(const ids of invalid){
   expect(validComparisonSelection(ids)).toBe(false);
   const result=await comparePublishedHistoricalPortfolios(base,ids,fetcher as typeof fetch);
   expect(result.data).toBeNull();
  }
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("never posts research IDs to external or non-local hosts",async()=>{
  const fetcher=vi.fn();
  for(const url of [undefined,"https://example.org","http://192.168.1.5:8000"]){
   const value=await comparePublishedHistoricalPortfolios(url,[idA,idB],fetcher as typeof fetch);
   expect(value.data).toBeNull();
  }
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("fails closed if the response invents approval or omits comparability notices",()=>{
  const changed=[
   comparison({executable:true}),
   comparison({items:[summary(idA),{...summary(idB),pitVerified:true}]}),
   comparison({items:[summary(idA),summary(idA)]}),
   comparison({items:[summary(idA)]}),
   comparison({comparability:{...comparison().comparability,valuationPolicyComparison:"same"}}),
   comparison({comparability:{...comparison().comparability,notices:[]}}),
   comparison({items:[summary(idA),{...summary(idB),tickerCount:6}]}),
  ];
  for(const value of changed)expect(validHistoricalComparison(value,[idA,idB])).toBe(false);
 });
 it("preserves explicit period difference and nullable mark comparison",()=>{
  const value=comparison({
   comparability:{...comparison().comparability,periodsDiffer:true,valuationTimestampsDiffer:null,
    notices:["no_ranking_or_recommendation","valuation_policy_not_in_published_projection","analysis_periods_differ"]}
  });
  expect(validHistoricalComparison(value,[idA,idB])).toBe(true);
 });
 it.each([403,404,422,503])("reports HTTP %i without mock comparison",async status=>{
  const result=await comparePublishedHistoricalPortfolios(base,[idA,idB],
   (async()=>new Response(null,{status})) as typeof fetch);
  expect(result.data).toBeNull();
  expect(result.error).toBeTruthy();
 });
 it("rejects bad JSON and transport errors",async()=>{
  const invalid=await comparePublishedHistoricalPortfolios(base,[idA,idB],
   (async()=>Response.json({})) as typeof fetch);
  const network=await comparePublishedHistoricalPortfolios(base,[idA,idB],
   (async()=>{throw Error("offline")}) as typeof fetch);
  expect(invalid.data).toBeNull();
  expect(network.data).toBeNull();
 });
});
