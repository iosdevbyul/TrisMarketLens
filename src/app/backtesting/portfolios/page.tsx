import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {loadPublishedPortfolios} from "@/data/HistoricalPortfolioDataSource";
import {
 addHistoricalSelection,historicalCatalogHref,historicalCompareHref,
 parseHistoricalSelection,removeHistoricalSelection
} from "@/domain/historicalPortfolioSelection";

export default async function PublishedPortfoliosPage({
 searchParams
}:{searchParams:Promise<{offset?:string;id?:string|string[]}>}){
 const query=await searchParams;
 const rawOffset=query.offset??"0";
 const offset=/^(0|[1-9]\d{0,5})$/.test(rawOffset)?Number(rawOffset):NaN;
 const selected=parseHistoricalSelection(query.id);
 const comparisonHref=historicalCompareHref(selected);
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
   {query.id!==undefined&&selected.length===0?<p role="status" className="metric-detail">Invalid comparison selection was cleared. Select distinct published report IDs only.</p>:null}
   <section className="panel" aria-label="Selected historical portfolio reports">
    <div className="panel-heading">
     <h3>Selected for research comparison</h3>
     <span className="panel-count">{selected.length} of 5 selected</span>
    </div>
    <p className="section-copy">Selection is retained in the page URL when browsing the catalog. Select 2–5 reports from any catalog pages. Selections are not stored on a server or sent to a broker.</p>
    {selected.length===0?<p className="metric-detail">No reports selected yet.</p>:null}
    {selected.map((id,index)=><p key={id} className="metric-detail">
     <span>Report {index+1}: <code>{id.slice(0,16)}…</code></span>{" "}
     <Link href={historicalCatalogHref(offset,removeHistoricalSelection(selected,id))}>Remove</Link>
    </p>)}
    {comparisonHref?<p><Link href={comparisonHref}>Compare {selected.length} selected research reports</Link></p>
      :<p className="metric-detail">{selected.length<2?"Select at least two reports to compare.":"Select no more than five reports."}</p>}
    {selected.length>0?<p><Link href={historicalCatalogHref(offset,[])}>Clear selection</Link></p>:null}
   </section>
   {page&&page.items.length===0?<p className="section-copy">No published reports on this page.</p>:null}
   {page?.items.map(item=>{
    const included=selected.includes(item.reportId);
    const canAdd=!included&&selected.length<5;
    return <article className="operations-run" key={item.reportId}>
     <div>
      <strong>{item.modelFamily.toUpperCase()} · {item.tickers.join(", ")}</strong>
      <p className="metric-detail">Report ID: <code>{item.reportId}</code></p>
      <p><Link href={"/backtesting/portfolios/"+item.reportId}>View published summary and decision history</Link></p>
      <p className="metric-detail">Published: {item.publishedAt} · Initial virtual cash: {item.initialVirtualCash}</p>
      <p className="metric-detail">Evidence scope: {item.evidenceScope} · Final portfolio valuation: {item.portfolioValuationAvailable?"Recorded":"Unavailable"}</p>
      <p className="metric-detail">Archive integrity verified; offline replay verified. PIT/OOS and trading approval: not verified.</p>
      <p>{included?<Link href={historicalCatalogHref(offset,removeHistoricalSelection(selected,item.reportId))}>Remove from comparison</Link>
       :canAdd?<Link href={historicalCatalogHref(offset,addHistoricalSelection(selected,item.reportId))}>Add to comparison</Link>
       :<span className="metric-detail">Five reports selected; remove one to select another.</span>}</p>
     </div>
     <span className="status-pill" data-state="blocked">Research only</span>
    </article>;
   })}
   {page?<nav aria-label="Publication pages" className="recorded-run-controls">
    {offset>0?<Link href={historicalCatalogHref(Math.max(0,offset-10),selected)}>Previous page</Link>:null}
    <span className="metric-detail">Returned {page.items.length} of {page.total} reports (offset {offset})</span>
    {next!==null&&page.items.length>0?<Link href={historicalCatalogHref(offset+page.items.length,selected)}>Next page</Link>:null}
   </nav>:null}
  </section>
 </>;
}
