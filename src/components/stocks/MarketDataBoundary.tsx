import Link from "next/link";
export function MarketDataBoundary({ticker}:{ticker?:string}){
 return <section className="panel single-panel" aria-label="Operational and research data boundaries">
  <div className="panel-heading"><div><p className="eyebrow">Data provenance</p><h2>Operational observations vs. research records</h2></div></div>
  <p className="section-copy">These datasets have different publication and validation rules. A matching ticker code does not establish that the records describe the same verified research security or a fully validated trading history.</p>
  <div className="operations-overview-grid">
   <div className="operations-overview-stat"><span>Operational collection</span><strong>Unreviewed observations</strong><p className="metric-detail">Pinned operational SQLite snapshot; collected original OHLCV. Not approved for research signals or trading.</p></div>
   <div className="operations-overview-stat"><span>Research publication</span><strong>Separately reviewed</strong><p className="metric-detail">Published research snapshot with distinct coverage, identity and evidence constraints. It may not contain this ticker.</p></div>
  </div>
  {ticker?<p className="section-copy"><Link href={"/stocks/"+encodeURIComponent(ticker)}>Open research record for {ticker}</Link> (if published). This is a separate data source, not a merged price history.</p>:
   <p className="section-copy"><Link href="/stocks">Browse published research stocks</Link>. Research coverage can differ from operational collection.</p>}
 </section>;
}
