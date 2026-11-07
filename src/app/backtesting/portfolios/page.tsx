import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {loadPublishedPortfolios} from "@/data/HistoricalPortfolioDataSource";

export default async function PublishedPortfoliosPage({
 searchParams
}:{searchParams:Promise<{offset?:string}>}){
 const query=await searchParams;
 const rawOffset=query.offset??"0";
 const offset=/^(0|[1-9]\d{0,5})$/.test(rawOffset)?Number(rawOffset):NaN;
 const isHttp=process.env.MARKET_LENS_DATA_SOURCE==="http";
 const result=isHttp
  ?await loadPublishedPortfolios(process.env.DONGHAK_API_BASE_URL,offset)
  :{data:null,error:"HTTP mode is required to read actual published portfolios. Demo data is never substituted."};
 const page=result.data;
 const next=page?offset+page.items.length<page.total:null;
 return <>
  <Link className="back-link" href="/backtesting">← Back to backtesting</Link>
  <PageHeader
   eyebrow="Backtesting"
   title="Published historical portfolios"
   badge={page?"Research only":"Unavailable"}
   description="Read-only published research archives from the local DonghakStockVision API. Neither publication nor integrity checks establish live trading permission, investment suitability, point-in-time validity, or out-of-sample validation."
  />
  <section className="panel single-panel" aria-label="Historical portfolio publications">
   <div className="panel-heading">
    <h2>Verified archive publications</h2>
    <span className="panel-count">{page?page.total+" published reports":"No verified listing"}</span>
   </div>
   <p className="section-copy">Only operator-pinned, non-revoked publications returned by the backend are listed. Performance and simulated profits are not inferred. This page never starts backtests or accesses a broker.</p>
   {result.error?<p role="status" className="metric-detail">{result.error}</p>:null}
   {page&&page.items.length===0?<p className="section-copy">No published reports on this page.</p>:null}
   {page&&page.items.length>=2?<p className="section-copy">Select 2 to 5 reports from this page, then compare published research evidence. Selecting reports does not authorize live trading.</p>:null}
   {page?<form action="/backtesting/portfolios/compare" method="get" aria-label="Compare published historical portfolios">
   {page.items.map(item=><article className="operations-run" key={item.reportId}>
    <label className="metric-detail">
     <input type="checkbox" name="id" value={item.reportId} aria-label={"Compare report "+item.reportId}/>
     {" "}Select for comparison
    </label>
    <div>
     <strong>{item.modelFamily.toUpperCase()} · {item.tickers.join(", ")}</strong>
     <p className="metric-detail">Report ID: <code>{item.reportId}</code></p>
     <p><Link href={"/backtesting/portfolios/"+item.reportId}>View published summary and decision history</Link></p>
     <p className="metric-detail">Published: {item.publishedAt} · Initial virtual cash: {item.initialVirtualCash}</p>
     <p className="metric-detail">Evidence scope: {item.evidenceScope} · Final portfolio valuation: {item.portfolioValuationAvailable?"Recorded":"Unavailable"}</p>
     <p className="metric-detail">Archive integrity verified; offline replay verified. PIT/OOS and trading approval: not verified.</p>
    </div>
    <span className="status-pill" data-state="blocked">Research only</span>
   </article>)}
   {page.items.length>=2?<p><button type="submit">Compare selected reports (2–5)</button></p>:null}
   </form>:null}
   {page?<nav aria-label="Publication pages" className="recorded-run-controls">
    {offset>0?<Link href={"/backtesting/portfolios?offset="+Math.max(0,offset-10)}>Previous page</Link>:null}
    <span className="metric-detail">Returned {page.items.length} of {page.total} reports (offset {offset})</span>
    {next?<Link href={"/backtesting/portfolios?offset="+(offset+page.items.length)}>Next page</Link>:null}
   </nav>:null}
  </section>
 </>;
}
