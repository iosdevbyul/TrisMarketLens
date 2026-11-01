import {MarketDataBoundary} from "@/components/stocks/MarketDataBoundary";
import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {OperationalOhlcvExport} from "@/components/stocks/OperationalOhlcvExport";
import {OhlcvChart} from "@/components/stocks/OhlcvChart";
import {getLocale} from "@/i18n/server";
import {loadOperationalBars} from "@/data/OperationalMarketDataSource";

export default async function OperationalTickerPage({params}:{params:Promise<{ticker:string}>}){
 const {ticker}=await params;
 const result=process.env.MARKET_LENS_DATA_SOURCE==="http"
  ?await loadOperationalBars(ticker,process.env.DONGHAK_API_BASE_URL)
  :{data:null,error:"HTTP operational data source is not enabled."};
 const locale=await getLocale();
 const latest=result.data?.bars.at(-1);
 return <>
  <Link className="back-link" href="/operational-market">Back to collected tickers</Link>
  <PageHeader eyebrow="KRX operational collection" title={ticker} badge="Unreviewed operational observations" description="Original unadjusted observations from a pinned operational SQLite snapshot. No fabricated bars, trade signals or research validation."/>
  <section className="panel single-panel">
   <div className="panel-heading"><h2>Collected OHLCV history</h2><span className="panel-count">{result.data?.bars.length??0} observations</span></div>
   {result.error?<div className="run-lock" role="alert"><p>Collected prices unavailable</p><span>{result.error}</span></div>:null}
   {result.data?.bars.length?<OperationalOhlcvExport ticker={ticker} bars={result.data.bars} locale={locale}/>:null}
   {latest?<dl className="ohlcv-selected"><div><dt>Last observed date</dt><dd>{latest.date}</dd></div><div><dt>Last collected close</dt><dd>{latest.close.toLocaleString(locale==="ko"?"ko-KR":"en-US")}</dd></div><div><dt>Last collected volume</dt><dd>{latest.volume.toLocaleString(locale==="ko"?"ko-KR":"en-US")}</dd></div></dl>:null}
   {result.data?.bars.length?<OhlcvChart ticker={ticker} bars={result.data.bars} locale={locale}/>:result.data?<p className="section-copy">No collected bars in this operational snapshot.</p>:null}
  </section>
  <MarketDataBoundary ticker={ticker}/>
 </>;
}
