import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {OperationalTickerSearch} from "@/components/stocks/OperationalTickerSearch";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";

export default async function OperationalMarketPage({searchParams}:{searchParams:Promise<{offset?:string}>}){
 const raw=(await searchParams).offset??"0";
 const offset=/^(0|[1-9]\d{0,5})$/.test(raw)?Number(raw):-1;
 const enabled=process.env.MARKET_LENS_DATA_SOURCE==="http";
 const result=enabled?await loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL,offset):{data:null,error:"Enable MARKET_LENS_DATA_SOURCE=http to view actual operational observations."};
 return <>
  <PageHeader eyebrow="Market data" title="Collected KRX observations" badge="Unreviewed operational data" description="Read-only KOSPI observations from an operator-pinned operational SQLite snapshot. These records are not research-approved predictions or the research stock universe."/>
  <section className="panel single-panel" aria-label="Direct collected ticker lookup"><h2>Find collected OHLCV</h2><OperationalTickerSearch /><p className="section-copy">If the operational backend is not configured, the detail page will report that error instead of showing fictional bars.</p></section>
  {result.error?<div className="run-lock" role="alert"><p>Operational collection unavailable</p><span>{result.error}</span></div>:null}
  {result.data?<section className="panel single-panel">
   <div className="panel-heading"><h2>Collected tickers</h2><span className="panel-count">{result.data.total} observed tickers</span></div>
   <p className="section-copy">Observed universe count is from the configured snapshot, not a guarantee of 940 securities or market completeness.</p>
   <form action="/operational-market" method="get" aria-label="Jump to catalog page"><label htmlFor="catalog-offset">Catalog offset</label> <input id="catalog-offset" type="number" name="offset" min="0" max="100000" step="25" defaultValue={offset} required/> <button type="submit">Go to page</button></form>
   <p className="metric-detail">Showing {result.data.items.length?offset+1:0}–{offset+result.data.items.length} of {result.data.total} observed tickers.</p>
   <p className="section-copy">Select a listed ticker to view its collected OHLCV history. Data comes from the configured operational snapshot, not the research universe.</p>
   {result.data.items.length===0?<p className="section-copy">No observed tickers on this page.</p>:<div className="operations-runs">{result.data.items.map(item=><article className="operations-run" key={item.ticker}><div><strong><Link href={"/operational-market/"+item.ticker}>{item.ticker}</Link></strong><p className="metric-detail">Latest recorded date: {item.latestDataDate}</p></div><span className="status-pill" data-state="in_progress">Unreviewed</span></article>)}</div>}
   <nav aria-label="Operational catalog pagination">
    {offset>0?<Link href={"/operational-market?offset="+Math.max(0,offset-25)}>Previous</Link>:null}
    {result.data.items.length>0&&offset+result.data.items.length<result.data.total?<Link href={"/operational-market?offset="+(offset+25)}>Next page</Link>:null}
   </nav>
  </section>:null}
 </>;
}
