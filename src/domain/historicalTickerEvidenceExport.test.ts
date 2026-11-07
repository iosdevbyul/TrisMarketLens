import {describe,expect,it} from "vitest";
import type {HistoricalTickerEvidence} from "../data/HistoricalPortfolioTickerDataSource";
import {historicalTickerEvidenceCsv} from "./historicalTickerEvidenceExport";

const evidence={
 schemaVersion:"published_historical_portfolio_v1",
 reportId:"a".repeat(64),ticker:"005930",modelId:"model-test",
 researchOnly:true,operationalEligible:false,executable:false,pitVerified:false,
 oosVerified:false,investmentSuitabilityVerified:false,brokerageEligible:false,
 positions:[{position_id:"p1",ticker:"005930",status:"closed",quantity:2,realized_net_pnl:"-500"}],
 realizedNetPnl:"-500",valuation:null,unavailable:{valuation:"no_final_position_mark"},
 timeline:[{ticker:"005930",trading_date:"2025-01-03",action:"HOLD",
  selected_rule:"source-only",opportunity_id:"o1",decision_at:"2025-01-03T10:00:00Z"}],
 total:20,offset:10,limit:10
} as HistoricalTickerEvidence;

describe("per-ticker historical research CSV export",()=>{
 it("retains original archive identity, source JSON and explicitly limited page scope",()=>{
  const csv=historicalTickerEvidenceCsv(evidence);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain(evidence.reportId);
  expect(csv).toContain('"005930"');
  expect(csv).toContain("current_page_only");
  expect(csv).toContain("Partial page export only");
  expect(csv).toContain("no_final_position_mark");
  expect(csv).toContain("research_opportunity");
  expect(csv).toContain("recorded_position");
  expect(csv).toContain("HOLD");
  expect(csv).toContain("o1");
  expect(csv).toContain('"11"');
 });
 it("escapes source quotes, delimiters and prevents formula execution",()=>{
  const changed={...evidence,timeline:[{
   ...evidence.timeline[0],selected_rule:'=HYPERLINK("https://example.org","click")',
   opportunity_id:"o,2",action:"+\tbad"
  }]} as HistoricalTickerEvidence;
  const csv=historicalTickerEvidenceCsv(changed);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('""');
  expect(csv).toContain('"o,2"');
  expect(csv).toContain("'+\tbad");
 });
 it("preserves unavailable values instead of fabricating marks or completeness",()=>{
  const empty={...evidence,timeline:[],positions:[],realizedNetPnl:null,total:0,offset:0,
   unavailable:{realizedNetPnl:"ticker_realized_pnl_not_recorded"}} as HistoricalTickerEvidence;
  const csv=historicalTickerEvidenceCsv(empty);
  expect(csv).toContain("ticker_realized_pnl_not_recorded");
  expect(csv).toContain("Unavailable");
  expect(csv).toContain("no live broker fills");
  expect(csv).not.toContain("CAGR");
 });
});
