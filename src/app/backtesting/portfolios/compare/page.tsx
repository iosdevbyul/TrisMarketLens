import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {HistoricalComparisonExport} from "@/components/backtesting/HistoricalComparisonExport";
import {comparePublishedHistoricalPortfolios} from "@/data/HistoricalPortfolioComparisonDataSource";

const unavailable=(value:string|null)=>value??"Unavailable";
const decision=(value:boolean|null)=>value===null?"Unavailable":value?"Yes":"No";

export default async function HistoricalPortfolioComparePage({
 searchParams
}:{searchParams:Promise<{id?:string|string[]}>}){
 const query=await searchParams;
 const reportIds=Array.isArray(query.id)?query.id:query.id?[query.id]:[];
 const base=process.env.MARKET_LENS_DATA_SOURCE==="http"?process.env.DONGHAK_API_BASE_URL:undefined;
 const {data,error}=await comparePublishedHistoricalPortfolios(base,reportIds);
 const items=data?.items??[];
 const rows=data?[
  {name:"Published",values:items.map(x=>x.publishedAt)},
  {name:"Model family",values:items.map(x=>x.modelFamily.toUpperCase())},
  {name:"Research model",values:items.map(x=>x.modelId)},
  {name:"Research period",values:items.map(x=>Object.entries(x.period).map(([name,value])=>name+": "+value).join(" · "))},
  {name:"Tickers",values:items.map(x=>x.tickers.join(", "))},
  {name:"Evidence scope",values:items.map(x=>x.evidenceScope)},
  {name:"Data origin",values:items.map(x=>x.dataOrigin)},
  {name:"Initial virtual cash",values:items.map(x=>x.initialVirtualCash)},
  {name:"Final total cash",values:items.map(x=>x.finalTotalCash)},
  {name:"Realized net P&L",values:items.map(x=>x.realizedNetPnl)},
  {name:"Final portfolio equity",values:items.map(x=>unavailable(x.finalPortfolioEquity))},
  {name:"Portfolio return",values:items.map(x=>unavailable(x.portfolioReturn))},
  {name:"Valuation available",values:items.map(x=>x.portfolioValuationAvailable?"Recorded":"Unavailable")},
  {name:"Decisions",values:items.map(x=>String(x.decisionCount))},
  {name:"Accepted orders",values:items.map(x=>String(x.acceptedOrderCount))},
  {name:"Simulated fills",values:items.map(x=>String(x.fillCount))},
  {name:"Pending orders",values:items.map(x=>String(x.pendingOrderCount))},
  {name:"Valuation observation time",values:items.map(x=>unavailable(x.valuationBasis.timestamp))},
  {name:"Observed valuation fields",values:items.map(x=>x.valuationBasis.observedMarkFields?.join(", ")??"Unavailable")},
  {name:"Valuation policy",values:items.map(()=>"Unavailable")}
 ]:[];
 return <>
  <Link className="back-link" href="/backtesting/portfolios">← Back to published portfolios</Link>
  <PageHeader eyebrow="Historical research" title="Published portfolio comparison"
   badge={data?"Research only":"Unavailable"}
   description="Side-by-side recorded historical research. No ranking, trading recommendation or inferred performance. Different periods, missing valuation marks and unavailable policies can make economic comparison invalid."/>
  {error?<section className="panel single-panel" role="status"><p className="metric-detail">{error}</p></section>:null}
  {data?<section className="panel single-panel" aria-label="Historical portfolio comparability">
   <div className="panel-heading"><h2>Evidence comparability</h2><span className="status-pill" data-state="blocked">No ranking</span></div>
   <div className="operations-overview-grid">
    <div className="operations-overview-stat"><span>Periods differ</span><strong>{decision(data.comparability.periodsDiffer)}</strong></div>
    <div className="operations-overview-stat"><span>Valuation times differ</span><strong>{decision(data.comparability.valuationTimestampsDiffer)}</strong></div>
    <div className="operations-overview-stat"><span>Observed mark fields differ</span><strong>{decision(data.comparability.observedMarkFieldsDiffer)}</strong></div>
    <div className="operations-overview-stat"><span>Valuation policy comparison</span><strong>Unavailable</strong></div>
   </div>
   <h3>Backend comparison notices</h3>
   {data.comparability.notices.map(notice=><p className="metric-detail" key={notice}>{notice.replaceAll("_"," ")}</p>)}
   {Object.entries(data.comparability.unavailable).map(([field,reason])=>
    <p className="metric-detail" key={field}>Unavailable {field}: {reason.replaceAll("_"," ")}</p>)}
  </section>:null}
  {data?<section className="panel single-panel" aria-label="Published portfolio side by side comparison">
   <div className="panel-heading"><h2>Recorded portfolio fields</h2><span className="panel-count">{items.length} publications</span></div>
   <HistoricalComparisonExport comparison={data}/>
   <p className="section-copy">Values below are backend-published historical evidence, not current balances or independently calculated returns. A missing field is never estimated. The columns follow the selected report order, not performance rank.</p>
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
     <thead><tr>
      <th scope="col" style={{padding:"0.75rem"}}>Recorded field</th>
      {items.map((item,index)=><th scope="col" key={item.reportId} style={{padding:"0.75rem"}}>
       <Link href={"/backtesting/portfolios/"+item.reportId}>Report {index+1}</Link>
       <p className="metric-detail"><code>{item.reportId.slice(0,12)}…</code></p>
      </th>)}
     </tr></thead>
     <tbody>{rows.map(row=><tr key={row.name} style={{borderTop:"1px solid var(--border, #ccc)"}}>
      <th scope="row" style={{padding:"0.75rem"}}>{row.name}</th>
      {row.values.map((value,index)=><td style={{padding:"0.75rem",verticalAlign:"top"}} key={items[index].reportId}>{value}</td>)}
     </tr>)}</tbody>
    </table>
   </div>
   <p className="metric-detail">All reports are research-only, non-executable, non-brokerage eligible, and not verified for PIT, OOS, or investment suitability.</p>
  </section>:null}
 </>;
}
