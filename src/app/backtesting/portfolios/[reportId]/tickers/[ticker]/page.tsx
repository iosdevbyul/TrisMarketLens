import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {HistoricalTickerEvidenceExport} from "@/components/backtesting/HistoricalTickerEvidenceExport";
import {loadHistoricalTickerEvidence} from "@/data/HistoricalPortfolioTickerDataSource";

function textValue(value:unknown):string {
 return typeof value==="string"||typeof value==="number"?String(value):"Unavailable";
}
export default async function PortfolioTickerPage({
 params,searchParams
}:{params:Promise<{reportId:string;ticker:string}>;searchParams:Promise<{offset?:string}>}){
 const [{reportId,ticker},query]=await Promise.all([params,searchParams]);
 const rawOffset=query.offset??"0";
 const offset=/^(0|[1-9]\d{0,5})$/.test(rawOffset)?Number(rawOffset):NaN;
 const base=process.env.MARKET_LENS_DATA_SOURCE==="http"?process.env.DONGHAK_API_BASE_URL:undefined;
 const {data,error}=await loadHistoricalTickerEvidence(base,reportId,ticker,offset);
 return <>
  <Link className="back-link" href={"/backtesting/portfolios/"+reportId}>← Back to portfolio detail</Link>
  <PageHeader eyebrow="Historical research" title={"Ticker evidence · "+ticker}
   badge={data?"Research only":"Unavailable"}
   description="Per-security observations from the pinned historical portfolio research publication. Simulated fills and valuation references are not broker trades or live-price approvals."/>
  {error?<section className="panel single-panel"><p className="metric-detail" role="status">{error}</p></section>:null}
  {data?<section className="panel single-panel" aria-label="Published ticker position evidence">
   <div className="panel-heading"><h2>Recorded security position summary</h2><span className="status-pill" data-state="blocked">Not executable</span></div>
   <p className="metric-detail">Published report: <code>{data.reportId}</code> · Model: {data.modelId}</p>
   <div className="operations-overview-grid">
    <div className="operations-overview-stat"><span>Recorded realized net P&amp;L</span><strong>{data.realizedNetPnl??"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Final valuation</span><strong>{data.valuation?"Recorded mark details available":"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Recorded positions</span><strong>{data.positions.length}</strong></div>
   </div>
   {data.valuation?<p className="metric-detail">A historical valuation record is present. It is not a live market price or independently approved valuation.</p>:null}
   {data.realizedNetPnl===null?<p className="metric-detail">Realized P&amp;L not recorded: {data.unavailable.realizedNetPnl}</p>:null}
   {data.unavailable.valuation?<p className="metric-detail">Final mark unavailable: {data.unavailable.valuation}</p>:null}
   {data.positions.length===0?<p className="section-copy">No recorded positions for this ticker.</p>:null}
   {data.positions.map((position,index)=><article className="operations-run" key={String(position.position_id??index)}>
    <div>
     <strong>Position {textValue(position.position_id)}</strong>
     <p className="metric-detail">Status: {textValue(position.status)} · Quantity: {textValue(position.quantity)}</p>
     <p className="metric-detail">Acquired at: {textValue(position.acquired_at)} · Exited at: {textValue(position.exited_at)}</p>
     <p className="metric-detail">Recorded realized net P&amp;L: {textValue(position.realized_net_pnl)}</p>
    </div>
   </article>)}
  </section>:null}
  {data?<section className="panel single-panel" aria-label="Published ticker timeline">
   <div className="panel-heading"><h2>Research opportunity timeline</h2><span className="panel-count">{data.total} recorded opportunities</span></div>
   <p className="section-copy">Each row represents the original examined opportunity, including HOLD/WAIT and no-order outcomes. Timeline entries are not brokerage execution confirmations.</p>
   <HistoricalTickerEvidenceExport evidence={data}/>
   {data.timeline.length===0?<p className="metric-detail">No timeline evidence on this page.</p>:null}
   {data.timeline.map((event,index)=><article className="operations-run" key={String(event.opportunity_id??offset+index)}>
    <div>
     <strong>{textValue(event.trading_date)} · {ticker}</strong>
     <p className="metric-detail">Decision: {textValue(event.action)} · Rule: {textValue(event.selected_rule)}</p>
     <p className="metric-detail">Opportunity: <code>{textValue(event.opportunity_id)}</code></p>
     <p className="metric-detail">Model: {textValue(event.model_id)} · Decision at: {textValue(event.decision_at)}</p>
    </div>
    <span className="status-pill" data-state="blocked">Research</span>
   </article>)}
   <nav aria-label="Ticker evidence pagination" className="recorded-run-controls">
    {offset>0?<Link href={"/backtesting/portfolios/"+reportId+"/tickers/"+ticker+"?offset="+Math.max(0,offset-10)}>Previous page</Link>:null}
    <span className="metric-detail">{data.timeline.length} of {data.total} returned · Offset {offset}</span>
    {data.timeline.length>0&&offset+data.timeline.length<data.total?<Link href={"/backtesting/portfolios/"+reportId+"/tickers/"+ticker+"?offset="+(offset+data.timeline.length)}>Next page</Link>:null}
   </nav>
  </section>:null}
 </>;
}
