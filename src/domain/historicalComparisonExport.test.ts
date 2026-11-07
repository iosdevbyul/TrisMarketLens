import {describe,expect,it} from "vitest";
import type {HistoricalPortfolioComparison} from "../data/HistoricalPortfolioComparisonDataSource";
import {historicalComparisonCsv} from "./historicalComparisonExport";

const sample=(reportId:string)=>({
 reportId,publishedAt:"2026-11-02T00:00:00Z",modelFamily:"linear",modelId:"model-x",
 period:{start:"2025-01-01",end:"2025-06-30"},
 tickers:["005930","000660","035420","051910","068270"],
 evidenceScope:"controlled mechanics",dataOrigin:"synthetic",
 initialVirtualCash:"1000000",finalTotalCash:"990000",realizedNetPnl:"-10000",
 finalPortfolioEquity:null,portfolioReturn:null,portfolioValuationAvailable:false,
 decisionCount:5,acceptedOrderCount:1,fillCount:0,pendingOrderCount:1,
 valuationBasis:{timestamp:null,stage:null,observedMarkFields:null,
  unavailable:{policy:"valuation_policy_not_in_published_projection"}},
 signalEvidenceScopes:["controlled_mechanics_test_double"],
 archiveVerification:"integrity_verified",reportVerification:"offline_authoritative_replay_passed",
 researchOnly:true,executable:false,operationalEligible:false,pitVerified:false,
 oosVerified:false,brokerageEligible:false,investmentSuitabilityVerified:false,
 limitations:["No valuation; no recommendation"],unavailable:{portfolioReturn:"valuation unavailable"}
});
const comparison={
 items:[sample("a".repeat(64)),sample("b".repeat(64))],
 comparability:{periodsDiffer:false,valuationTimestampsDiffer:null,
  observedMarkFieldsDiffer:null,valuationPolicyComparison:"unavailable",
  unavailable:{valuationTimestampsDiffer:"valuation_comparison_evidence_unavailable"},
  notices:["no_ranking_or_recommendation","synthetic_results_not_real_market_performance"]}
} as unknown as HistoricalPortfolioComparison;

describe("historical research comparison CSV",()=>{
 it("preserves source IDs, selected column order, missing marks and comparability notices",()=>{
  const csv=historicalComparisonCsv(comparison);
  expect(csv.startsWith("\uFEFF\"Field\",\"Report 1\",\"Report 2\"")).toBe(true);
  expect(csv).toContain('"Report ID","'+("a".repeat(64))+'","'+("b".repeat(64))+'"');
  expect(csv).toContain('"Final portfolio equity","Unavailable","Unavailable"');
  expect(csv).toContain('"Portfolio return","Unavailable","Unavailable"');
  expect(csv).toContain('"Comparison: valuation timestamps differ","Unavailable",""');
  expect(csv).toContain("no_ranking_or_recommendation");
  expect(csv).toContain("synthetic_results_not_real_market_performance");
  expect(csv).not.toContain("NaN");
 });
 it("quotes commas and line breaks and neutralizes spreadsheet formulas in untrusted evidence",()=>{
  const malicious={
   ...comparison,
   items:[{...comparison.items[0],modelId:"=HYPERLINK(\"https://example.org\")",
    limitations:["A, B\r\nnew line"],realizedNetPnl:"-250"},comparison.items[1]]
  } as HistoricalPortfolioComparison;
  const csv=historicalComparisonCsv(malicious);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('"A, B\r\nnew line"');
  expect(csv).toContain("'-250");
 });
 it("records explicit no-trading flags without calculating performance metrics",()=>{
  const csv=historicalComparisonCsv(comparison);
  expect(csv).toContain('"Executable","false","false"');
  expect(csv).toContain('"Brokerage eligible","false","false"');
  expect(csv).toContain("no_ranking_or_recommendation");
  expect(csv).not.toContain("CAGR");
 });
});
