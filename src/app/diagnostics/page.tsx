import Link from "next/link";
import {loadOperationalCatalog,loadOperationalBars} from "@/data/OperationalMarketDataSource";
import {getOhlcv} from "@/data/OhlcvDataSource";
import {getStockAnalysis} from "@/data/StockAnalysisDataSource";
import {PageHeader} from "@/components/common/PageHeader";
import {checkBackendHealth} from "@/data/backendHealth";
import {getOperations} from "@/data/OperationsDataSource";
import {getFreshness} from "@/data/FreshnessDataSource";
import {getOperationalAlerts} from "@/data/OperationalAlertsDataSource";
import {getScreener} from "@/data/ScreenerDataSource";
import {getFeatureDataState} from "@/domain/featureDataState";
import {assessReadiness,summarizeBackendDiagnostics} from "@/domain/backendDiagnostics";
import {diagnosticRemediations} from "@/domain/diagnosticRemediations";

export default async function DiagnosticsPage({searchParams}:{searchParams:Promise<{ticker?:string}>}){
 const requested=(await searchParams).ticker?.trim().toUpperCase()??"";
 const validTicker=/^[0-9A-Z]{6}$/.test(requested);
 const mode=process.env.MARKET_LENS_DATA_SOURCE??"mock";
 const [health,operations,freshness,alerts,screener]=await Promise.all([
  mode==="http"?checkBackendHealth(process.env.DONGHAK_API_BASE_URL):Promise.resolve(null),
  getOperations(),getFreshness(),getOperationalAlerts(),getScreener()
 ]);
 const status=summarizeBackendDiagnostics(mode,health);
 const operational=mode==="http"?await loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL):{data:null,error:"HTTP mode is not enabled"};
 const operationalBars=validTicker&&mode==="http"?await loadOperationalBars(requested,process.env.DONGHAK_API_BASE_URL):null;
 const selected=validTicker?await Promise.all([getOhlcv(requested),getStockAnalysis(requested)]):null;
 const selectedSources=selected?[
  {name:"OHLCV",state:getFeatureDataState(selected[0].source,selected[0].error,selected[0].data.bars.length),error:selected[0].error,count:selected[0].data.bars.length},
  {name:"Stock analysis",state:getFeatureDataState(selected[1].source,selected[1].error,selected[1].data.records.length),error:selected[1].error,count:selected[1].data.records.length},
 ]:[];
 const sources=[
  {name:"Operations runs",state:getFeatureDataState(operations.source,operations.error,operations.snapshot.runs.length),error:operations.error},
  {name:"Data freshness",state:getFeatureDataState(freshness.source,freshness.error,freshness.report?.state?1:0),error:freshness.error},
  {name:"Operational alerts",state:getFeatureDataState(alerts.source,alerts.error,alerts.data.alerts.length),error:alerts.error},
  {name:"AI Screener",state:getFeatureDataState(screener.source,screener.error,screener.data.entries.length),error:screener.error}
 ];
 const readiness=assessReadiness(mode,health,[...sources,...selectedSources].map(item=>item.state),validTicker);
 const nextSteps=diagnosticRemediations(readiness,[...sources,...selectedSources],validTicker);
 return <>
  <PageHeader eyebrow="Operations" title="Backend diagnostics" badge={status} description="Read-only connection checks. Healthy API transport does not certify data freshness, completeness or research approval."/>
  <section className="panel single-panel" aria-label="Operational readiness"><div className="panel-heading"><h2>Operational readiness</h2><span className="panel-count">{readiness}</span></div>
   <p className="section-copy">{readiness==="partial_evidence"?"Read-only endpoints responded for the selected ticker. Data provenance, completeness, market freshness and research approval are not certified.":readiness==="needs_review"?"Complete the selected ticker checks and review unavailable or disconnected sources before investigating evidence readiness.":readiness==="not_configured"?"The web is not configured to use the live HTTP backend.":"Backend transport must be restored before examining publication readiness."}</p>
  </section>
  <section className="panel single-panel" aria-label="Next verification steps">
   <div className="panel-heading"><h2>Next verification steps</h2><span className="panel-count">{nextSteps.length} actions</span></div>
   <ol>{nextSteps.map(step=><li key={step.id}><strong>{step.title}</strong><p className="metric-detail">{step.detail}</p></li>)}</ol>
   <p className="section-copy">These are recommended checks, not automatic repairs or verification certificates.</p>
  </section>
  <section className="panel single-panel" aria-label="Backend connection">
   <div className="panel-heading"><h2>Backend connection</h2><span className="panel-count">{status}</span></div>
   <p className="section-copy">Configured data mode: {mode}</p>
   {health&&health.status!=="ok"?<div className="run-lock" role="alert"><p>Backend unavailable</p><span>{health.detail}</span></div>:null}
   <p className="metric-detail">HTTP health verifies read-only transport only. Optional immutable market data and publication inputs are checked separately.</p>
  </section>
  <section className="panel single-panel" aria-label="Feature data status">
   <div className="panel-heading"><h2>Feature data status</h2></div>
   {sources.map(item=><article className="operations-run" key={item.name}>
    <div><strong>{item.name}</strong>{item.error?<p className="metric-detail" role="alert">{item.error}</p>:null}</div>
    <span className="status-pill" data-state={item.state==="error"?"blocked":item.state==="available"?"verified":"in_progress"}>{item.state}</span>
   </article>)}
   <p className="section-copy">Empty means a valid response with no records. Disconnected means no configured source. An HTTP error is never replaced with demo data.</p>
  </section>
  <section className="panel single-panel" aria-label="Collected operational market data">
   <div className="panel-heading"><h2>Collected KRX data</h2><span className="panel-count">{operational.data?operational.data.total+" observed tickers":"Unavailable"}</span></div>
   <p className="section-copy">Unreviewed operational snapshot, separate from the research market universe. A successful backend health response does not guarantee these endpoints are configured.</p>
   {operational.error?<p className="metric-detail" role="status">Catalog: {operational.error}</p>:null}
   {operational.data?<p className="metric-detail">API returned {operational.data.items.length} tickers on the first page. <Link href="/operational-market">Browse collected tickers</Link></p>:null}
   {validTicker?<article className="operations-run"><div><strong>Collected OHLCV: {requested}</strong>
    {operationalBars?.error?<p className="metric-detail" role="alert">{operationalBars.error}</p>:null}
    {operationalBars?.data?<p className="metric-detail">Observed bars: {operationalBars.data.bars.length}. Last date: {operationalBars.data.bars.at(-1)?.date??"—"}. <Link href={"/operational-market/"+requested}>View collected chart</Link></p>:null}
    {mode!=="http"?<p className="metric-detail">Requires HTTP mode</p>:null}
   </div></article>:null}
  </section>
  <section className="panel single-panel" aria-label="Ticker diagnostics"><h2>Ticker diagnostics</h2>
   <p className="section-copy">Enter an exact six-character ticker to check the read-only OHLCV and stock analysis endpoints.</p>
   <form action="/diagnostics" method="get"><label htmlFor="diagnostics-ticker">Ticker</label> <input id="diagnostics-ticker" name="ticker" type="text" defaultValue={requested} maxLength={6} pattern="[0-9A-Za-z]{6}" required/> <button type="submit">Check ticker</button></form>
   {requested&&!validTicker?<p role="alert" className="section-copy">Ticker must contain exactly six letters or digits.</p>:null}
   {validTicker?<><p className="section-copy">Selected ticker: {requested}</p>
    {selectedSources.map(item=><article className="operations-run" key={item.name}><div><strong>{item.name}</strong><p className="metric-detail">Returned records: {item.count}</p>{item.error?<p className="metric-detail" role="alert">{item.error}</p>:null}</div><span className="status-pill" data-state={item.state==="error"?"blocked":item.state==="available"?"verified":"in_progress"}>{item.state}</span></article>)}
   </>:null}
   <p className="metric-detail">A valid empty response is not the same as an API error. Results are read-only and do not establish publication completeness.</p>
  </section>
  <section className="panel single-panel"><h2>Optional publication checks</h2>
   <p className="section-copy">OHLCV and per-stock analysis require an explicitly selected ticker. Run npm run verify:extensions against an approved local backend to check those endpoints.</p>
   <p className="section-copy">Prediction evaluation remains disconnected because a reviewed publication endpoint is not available.</p>
  </section>
 </>;
}
