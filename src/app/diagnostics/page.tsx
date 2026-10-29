import {PageHeader} from "@/components/common/PageHeader";
import {checkBackendHealth} from "@/data/backendHealth";
import {getOperations} from "@/data/OperationsDataSource";
import {getFreshness} from "@/data/FreshnessDataSource";
import {getOperationalAlerts} from "@/data/OperationalAlertsDataSource";
import {getScreener} from "@/data/ScreenerDataSource";
import {getFeatureDataState} from "@/domain/featureDataState";
import {summarizeBackendDiagnostics} from "@/domain/backendDiagnostics";

export default async function DiagnosticsPage(){
 const mode=process.env.MARKET_LENS_DATA_SOURCE??"mock";
 const [health,operations,freshness,alerts,screener]=await Promise.all([
  mode==="http"?checkBackendHealth(process.env.DONGHAK_API_BASE_URL):Promise.resolve(null),
  getOperations(),getFreshness(),getOperationalAlerts(),getScreener()
 ]);
 const status=summarizeBackendDiagnostics(mode,health);
 const sources=[
  {name:"Operations runs",state:getFeatureDataState(operations.source,operations.error,operations.snapshot.runs.length),error:operations.error},
  {name:"Data freshness",state:getFeatureDataState(freshness.source,freshness.error,freshness.report?.state?1:0),error:freshness.error},
  {name:"Operational alerts",state:getFeatureDataState(alerts.source,alerts.error,alerts.data.alerts.length),error:alerts.error},
  {name:"AI Screener",state:getFeatureDataState(screener.source,screener.error,screener.data.entries.length),error:screener.error}
 ];
 return <>
  <PageHeader eyebrow="Operations" title="Backend diagnostics" badge={status} description="Read-only connection checks. Healthy API transport does not certify data freshness, completeness or research approval."/>
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
  <section className="panel single-panel"><h2>Optional publication checks</h2>
   <p className="section-copy">OHLCV and per-stock analysis require an explicitly selected ticker. Run npm run verify:extensions against an approved local backend to check those endpoints.</p>
   <p className="section-copy">Prediction evaluation remains disconnected because a reviewed publication endpoint is not available.</p>
  </section>
 </>;
}
