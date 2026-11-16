import { Localize } from "@/i18n/Localize";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getSecurityMetadataCatalog } from "@/data/SecurityMetadataCatalogDataSource";

export const dynamic="force-dynamic";
const LIMIT=50;
export default async function SecurityMetadataPage({
  searchParams,
}: {
  searchParams:Promise<{q?:string; page?:string; only?:string}>;
}) {
  const params=await searchParams;
  const catalog=await getSecurityMetadataCatalog();
  const q=(params.q??"").trim().slice(0,80).toUpperCase();
  const only=params.only==="unmapped"?"unmapped":"all";
  const page=/^[0-9]{1,4}$/.test(params.page??"") ? Number(params.page):1;
  const filtered=(catalog.data?.items??[]).filter(item=>
    (only!=="unmapped"||!item.corporationMappingVerified)
      && (!q||item.ticker.includes(q)||item.corporationName?.toUpperCase().includes(q)
        ||item.securityName?.toUpperCase().includes(q)));
  const totalPages=Math.max(1,Math.ceil(filtered.length/LIMIT));
  const currentPage=Math.max(1,Math.min(page,totalPages));
  const visible=filtered.slice((currentPage-1)*LIMIT,currentPage*LIMIT);
  const href=(next:number)=>"/security-metadata?"+new URLSearchParams({q,only,page:String(next)}).toString();
  return <>
    <Link href="/stocks" className="back-link"><Localize text="← Back to stocks"/></Link>
    <PageHeader eyebrow="Verified reference data" title="Security metadata catalog"
      badge={catalog.state==="available"?"Published backend metadata":catalog.state}
      description="Inspect the full research-snapshot security identity publication. Corporation mapping is not the same as independently verified current security names or historical ticker continuity."/>
    <section className="panel single-panel" aria-label="Security metadata source">
      <div className="panel-heading"><h2><Localize text="Publication status" /></h2><span className="panel-count"><Localize text={catalog.state}/></span></div>
      {catalog.error?<p role="status" className="section-copy">{catalog.error}</p>:null}
      <p className="section-copy"><Localize text="This endpoint is opt-in on DonghakStockVision. HTTP health or an operational stock catalog does not prove that security identity metadata is configured. No simulated records are substituted." /></p>
      {catalog.data ? <>
        <div className="operations-overview-grid">
          {([
            ["Securities in snapshot",catalog.data.universe],
            ["Verified security names",catalog.data.verifiedSecurityNames],
            ["Exact DART corporation mappings",catalog.data.linkedCorporations],
            ["Individual historical boundaries",catalog.data.historicalBoundaries],
            ["Source references",catalog.data.sourceCount],
          ] as const).map(([label,value])=><div key={label} className="operations-overview-stat"><span><Localize text={label}/></span><strong>{value}</strong></div>)}
        </div>
        <p className="metric-detail"><Localize text="All names and mappings are bounded by the source snapshot. No current-listing status, PIT approval, or full-history identity continuity is inferred." /></p>
      </>:null}
    </section>
    {catalog.data?<section className="panel single-panel" aria-label="Security metadata search">
      <div className="panel-heading"><h2><Localize text="Explore metadata" /></h2><span className="panel-count">{filtered.length} matches · page {currentPage} of {totalPages}</span></div>
      <form action="/security-metadata" method="get" className="stock-explorer">
        <label htmlFor="security-metadata-query"><Localize text="Ticker or published name" /></label>
        <input id="security-metadata-query" name="q" maxLength={80} defaultValue={q} placeholder="005930"/>
        <label htmlFor="security-metadata-only"><Localize text="Corporation mapping" /></label>
        <select id="security-metadata-only" name="only" defaultValue={only}>
          <option value="all"><Localize text="All" /></option><option value="unmapped"><Localize text="Unmapped only" /></option>
        </select>
        <button type="submit"><Localize text="Find securities" /></button>
      </form>
      {visible.length?<div className="stock-table" style={{overflowX:"auto"}}>
        <table style={{width:"100%",minWidth:"680px",textAlign:"left"}}>
          <thead><tr>{["Ticker","Security name","DART corporation","Current name verified","Relationship"].map(label=>
            <th key={label} scope="col" style={{padding:"10px"}}><Localize text={label}/></th>)}</tr></thead>
          <tbody>{visible.map(item=><tr key={item.ticker}>
            <td style={{padding:"10px"}}><Link href={"/stocks/"+item.ticker}>{item.ticker}</Link></td>
            <td style={{padding:"10px"}}>{item.securityName??<Localize text="Unavailable"/>}</td>
            <td style={{padding:"10px"}}>{item.corporationName??<Localize text="Unavailable"/>}</td>
            <td style={{padding:"10px"}}><Localize text={item.nameVerified?"Verified in snapshot":"Not verified"}/></td>
            <td style={{padding:"10px"}}><Localize text={item.corporationMappingVerified?"Exact DART mapping":"Unavailable"}/></td>
          </tr>)}</tbody>
        </table>
      </div>:<p role="status" className="section-copy"><Localize text="No securities match the selected filters." /></p>}
      <p className="metric-detail">Displayed {visible.length} of {filtered.length} filtered securities. Full backend publication is validated before any filtering; browsing is local to the server-rendered response.</p>
      <div style={{display:"flex",gap:"16px",marginTop:"16px"}}>
        {currentPage>1?<Link href={href(currentPage-1)}><Localize text="Previous page" /></Link>:null}
        {currentPage<totalPages?<Link href={href(currentPage+1)}><Localize text="Next page" /></Link>:null}
      </div>
    </section>:null}
  </>;
}
