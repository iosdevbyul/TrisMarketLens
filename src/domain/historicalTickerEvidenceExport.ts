import type {HistoricalTickerEvidence} from "../data/HistoricalPortfolioTickerDataSource";

const COLUMNS=[
 "Record type","Report ID","Ticker","Page offset","Page limit","Total opportunities",
 "Current page only","Row index","Trading date","Decision action","Selected rule",
 "Opportunity ID","Decision timestamp","Position ID","Position status","Quantity",
 "Recorded realized net P&L","Source evidence JSON"
] as const;
type Cell=string|number|boolean|null|undefined;
function csvCell(value:Cell):string{
 const raw=value===null||value===undefined?"Unavailable":String(value);
 // Prevent spreadsheet software interpreting downloaded source values as formulas.
 const literal=/^\s*[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+literal.replaceAll('"','""')+'"';
}
export function historicalTickerEvidenceCsv(data:HistoricalTickerEvidence):string{
 const partial=data.offset>0||data.total>data.timeline.length;
 const header:(Cell[])=[...COLUMNS];
 const metadata:Cell[]=[
  "scope",data.reportId,data.ticker,data.offset,data.limit,data.total,true,
  null,null,null,null,null,null,null,null,null,data.realizedNetPnl,
  JSON.stringify({
   exportScope:"current_page_only",partialHistory:partial,
   recordedPositions:data.positions.length,
   archiveRestrictions:{
    researchOnly:data.researchOnly,executable:data.executable,
    brokerageEligible:data.brokerageEligible,pitVerified:data.pitVerified,
    oosVerified:data.oosVerified,investmentSuitabilityVerified:data.investmentSuitabilityVerified
   },
   unavailable:data.unavailable,
   valuation:data.valuation===null?"Unavailable":"Historical mark present; not independently approved"
  })
 ];
 const positions:Cell[][]=data.positions.map((position,index)=>[
  "recorded_position",data.reportId,data.ticker,data.offset,data.limit,data.total,true,
  index+1,null,null,null,null,null,
  typeof position.position_id==="string"?position.position_id:null,
  typeof position.status==="string"?position.status:null,
  typeof position.quantity==="number"||typeof position.quantity==="string"?position.quantity:null,
  typeof position.realized_net_pnl==="string"?position.realized_net_pnl:null,
  JSON.stringify(position)
 ]);
 const events:Cell[][]=data.timeline.map((event,index)=>[
  "research_opportunity",data.reportId,data.ticker,data.offset,data.limit,data.total,true,
  data.offset+index+1,
  typeof event.trading_date==="string"?event.trading_date:null,
  typeof event.action==="string"?event.action:null,
  typeof event.selected_rule==="string"?event.selected_rule:null,
  typeof event.opportunity_id==="string"?event.opportunity_id:null,
  typeof event.decision_at==="string"?event.decision_at:null,
  null,null,null,null,JSON.stringify(event)
 ]);
 const warning:Cell[]=[
  "notice",data.reportId,data.ticker,data.offset,data.limit,data.total,true,
  null,null,null,null,null,null,null,null,null,null,
  "Partial page export only. Historical simulation research evidence; no live broker fills, full-history certification, trading eligibility or investment recommendation."
 ];
 const lines=[header,metadata,...positions,...events,warning];
 return "\uFEFF"+lines.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
