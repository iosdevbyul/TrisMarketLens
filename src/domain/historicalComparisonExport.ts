import type {HistoricalPortfolioComparison} from "../data/HistoricalPortfolioComparisonDataSource";

/** Export only fields already returned by the pinned backend comparison. No recalculations. */
export function historicalComparisonCsv(comparison:HistoricalPortfolioComparison):string{
 const items=comparison.items;
 const rows:(string|null)[][]=[
  ["Field",...items.map((_,index)=>"Report "+(index+1))],
  ["Report ID",...items.map(item=>item.reportId)],
  ["Publication date",...items.map(item=>item.publishedAt)],
  ["Model family",...items.map(item=>item.modelFamily)],
  ["Model ID",...items.map(item=>item.modelId)],
  ["Research period",...items.map(item=>JSON.stringify(item.period))],
  ["Tickers",...items.map(item=>item.tickers.join("; "))],
  ["Evidence scope",...items.map(item=>item.evidenceScope)],
  ["Data origin",...items.map(item=>item.dataOrigin)],
  ["Initial virtual cash",...items.map(item=>item.initialVirtualCash)],
  ["Final total cash",...items.map(item=>item.finalTotalCash)],
  ["Realized net P&L",...items.map(item=>item.realizedNetPnl)],
  ["Final portfolio equity",...items.map(item=>item.finalPortfolioEquity)],
  ["Portfolio return",...items.map(item=>item.portfolioReturn)],
  ["Portfolio valuation available",...items.map(item=>String(item.portfolioValuationAvailable))],
  ["Decision count",...items.map(item=>String(item.decisionCount))],
  ["Accepted order count",...items.map(item=>String(item.acceptedOrderCount))],
  ["Simulated fill count",...items.map(item=>String(item.fillCount))],
  ["Pending order count",...items.map(item=>String(item.pendingOrderCount))],
  ["Valuation observation timestamp",...items.map(item=>item.valuationBasis.timestamp)],
  ["Valuation stage",...items.map(item=>item.valuationBasis.stage)],
  ["Observed mark fields",...items.map(item=>item.valuationBasis.observedMarkFields?.join("; ")??null)],
  ["Valuation policy",...items.map(()=>"Unavailable")],
  ["Signal evidence scopes",...items.map(item=>item.signalEvidenceScopes.join("; "))],
  ["Archive verification",...items.map(item=>item.archiveVerification)],
  ["Report verification",...items.map(item=>item.reportVerification)],
  ["Research only",...items.map(item=>String(item.researchOnly))],
  ["Executable",...items.map(item=>String(item.executable))],
  ["Operationally eligible",...items.map(item=>String(item.operationalEligible))],
  ["PIT verified",...items.map(item=>String(item.pitVerified))],
  ["OOS verified",...items.map(item=>String(item.oosVerified))],
  ["Brokerage eligible",...items.map(item=>String(item.brokerageEligible))],
  ["Investment suitability verified",...items.map(item=>String(item.investmentSuitabilityVerified))],
  ["Recorded limitations",...items.map(item=>item.limitations.join("; "))],
  ["Unavailable source fields",...items.map(item=>JSON.stringify(item.unavailable))],
  ["Unavailable valuation basis",...items.map(item=>JSON.stringify(item.valuationBasis.unavailable))],
  ["Comparison: periods differ",String(comparison.comparability.periodsDiffer)],
  ["Comparison: valuation timestamps differ",comparison.comparability.valuationTimestampsDiffer===null?null:String(comparison.comparability.valuationTimestampsDiffer)],
  ["Comparison: observed mark fields differ",comparison.comparability.observedMarkFieldsDiffer===null?null:String(comparison.comparability.observedMarkFieldsDiffer)],
  ["Comparison: valuation policy comparison",comparison.comparability.valuationPolicyComparison],
  ["Comparison: unavailable evidence",JSON.stringify(comparison.comparability.unavailable)],
  ["Comparison: backend notices",comparison.comparability.notices.join("; ")],
  ["Comparison: interpretation","Research-only historical records; no ranking, recommendation, current brokerage execution, or inferred performance."]
 ];
 const width=items.length+1;
 const safe=(value:string|null):string=>{
  const raw=value??"Unavailable";
  // Spreadsheet cells beginning with formula triggers must remain literal text.
  const escaped=/^[\s]*[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
  return '"'+escaped.replaceAll('"','""')+'"';
 };
 return "\uFEFF"+rows.map(row=>Array.from({length:width},(_,index)=>safe(row[index]??"")).join(",")).join("\r\n")+"\r\n";
}
