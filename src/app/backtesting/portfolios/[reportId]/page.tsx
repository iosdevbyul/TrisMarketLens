import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {loadHistoricalPortfolioSummary,loadHistoricalPortfolioTrades} from "@/data/HistoricalPortfolioDetailDataSource";

export default async function PortfolioDetailPage({
 params,searchParams
}:{params:Promise<{reportId:string}>;searchParams:Promise<{offset?:string}>}){
 const [{reportId},search]=await Promise.all([params,searchParams]);
 const raw=search.offset??"0";
 const offset=/^(0|[1-9]\d{0,5})$/.test(raw)?Number(raw):NaN;
 const base=process.env.MARKET_LENS_DATA_SOURCE==="http"?process.env.DONGHAK_API_BASE_URL:undefined;
 const [summary,trades]=await Promise.all([
  loadHistoricalPortfolioSummary(base,reportId),
  loadHistoricalPortfolioTrades(base,reportId,offset)
 ]);
 const report=summary.data;
 const history=trades.data;
 const rows=report?[["Model",report.modelFamily.toUpperCase()+" · "+report.modelId],
  ["Published",report.publishedAt],
  ["Research period",Object.entries(report.period).map(([key,value])=>key+": "+value).join(" · ")],
  ["Tickers",report.tickers.join(", ")],
  ["Initial virtual cash",report.initialVirtualCash],
  ["Final total cash",report.finalTotalCash],
  ["Available cash",report.availableCash],
  ["Reserved cash",report.reservedCash],
  ["Realized net P&L",report.realizedNetPnl],
  ["Final portfolio equity",report.finalPortfolioEquity??"Unavailable"],
  ["Unrealized P&L",report.unrealizedPnl??"Unavailable"],
  ["Portfolio return",report.portfolioReturn??"Unavailable"],
  ["Decisions",String(report.decisionCount)],
  ["Accepted orders",String(report.acceptedOrderCount)],
  ["Fills",String(report.fillCount)],
  ["Open/pending orders",String(report.pendingOrderCount)]]:[];
 return <>
  <Link className="back-link" href="/backtesting/portfolios">← Back to published portfolios</Link>
  <PageHeader
   eyebrow="Historical research"
   title="Published portfolio detail"
   badge={report?"Research only":"Unavailable"}
   description="Frozen historical simulation evidence from a pinned local DonghakStockVision publication. No broker execution, PIT/OOS qualification, operational approval, or investment suitability is implied."
  />
  {summary.error?<p role="status" className="run-lock">{summary.error}</p>:null}
  {report?<section className="panel single-panel" aria-label="Recorded portfolio summary">
   <div className="panel-heading"><h2>Published simulation summary</h2><span className="status-pill" data-state="blocked">Not executable</span></div>
   <p className="metric-detail">Report ID: <code>{report.reportId}</code></p>
   <div className="operations-overview-grid">
    {rows.map(([label,value])=><div className="operations-overview-stat" key={label}>
     <span>{label}</span><strong>{value}</strong>
    </div>)}
   </div>
   <p className="metric-detail">Archive integrity verified; offline authoritative replay passed. Research only; brokerage and live trading eligibility denied.</p>
   <p className="metric-detail">Evidence scope: {report.evidenceScope} · Data origin: {report.dataOrigin}</p>
   {report.limitations.length>0?<div><h3>Recorded limitations</h3>{report.limitations.map((item,index)=><p className="metric-detail" key={index}>{item}</p>)}</div>:null}
  </section>:null}
  {report?<section className="panel single-panel" aria-label="Historical decision and trade evidence">
   <div className="panel-heading"><h2>Recorded decision and order outcomes</h2><span className="panel-count">{history?history.total+" records":"Unavailable"}</span></div>
   <p className="section-copy">These are simulated opportunity classifications, including no-order, rejected and pending outcomes. A filled classification is not a live brokerage execution.</p>
   {trades.error?<p role="status" className="metric-detail">{trades.error}</p>:null}
   {history?.items.length===0?<p className="metric-detail">No records on this page.</p>:null}
   {history?.items.map(item=><article className="operations-run" key={item.eventId}>
    <div>
     <strong>{item.evidence.ticker} · {item.evidence.trading_date}</strong>
     <p className="metric-detail">Simulated outcome: {item.classification} · Terminal status: {item.terminalStatus??"Not recorded"}</p>
     <p className="metric-detail">Evidence event: <code>{item.eventId}</code></p>
    </div>
    <span className="status-pill" data-state={item.classification==="filled"?"completed":"blocked"}>{item.classification}</span>
   </article>)}
   {history?<nav aria-label="Trade evidence pages" className="recorded-run-controls">
    {offset>0?<Link href={"/backtesting/portfolios/"+reportId+"?offset="+Math.max(0,offset-10)}>Previous page</Link>:null}
    <span className="metric-detail">Showing {history.items.length} of {history.total} recorded outcomes, offset {offset}</span>
    {offset+history.items.length<history.total&&history.items.length>0?<Link href={"/backtesting/portfolios/"+reportId+"?offset="+(offset+history.items.length)}>Next page</Link>:null}
   </nav>:null}
  </section>:null}
 </>;
}
