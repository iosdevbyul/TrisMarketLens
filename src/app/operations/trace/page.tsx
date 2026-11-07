import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {loadPinnedMarketSummary} from "@/data/PinnedMarketSummaryDataSource";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";
import {getOperations} from "@/data/OperationsDataSource";
import {getFreshness} from "@/data/FreshnessDataSource";
import {getOperationalAlerts} from "@/data/OperationalAlertsDataSource";
import {getSchedulerDiagnostics} from "@/data/KrxSchedulerDiagnosticsDataSource";
import {getDataSource} from "@/data/getDataSource";
import {getScreener} from "@/data/ScreenerDataSource";
import {createOperationsTrace,type TraceInputs} from "@/domain/operationsTrace";

export default async function OperationsTracePage(){
 const mode=process.env.MARKET_LENS_DATA_SOURCE??"mock";
 const api=process.env.DONGHAK_API_BASE_URL;
 const dataSource=mode==="http"&&api?.trim()?getDataSource():null;
 const [pinned,catalog,operations,freshness,alerts,scheduler,research,screener]=await Promise.allSettled([
  mode==="http"?loadPinnedMarketSummary(api):Promise.resolve(null),
  mode==="http"?loadOperationalCatalog(api):Promise.resolve(null),
  getOperations(),getFreshness(),getOperationalAlerts(),getSchedulerDiagnostics(),
  dataSource?dataSource.getCoverageSummary():Promise.resolve(null),
  getScreener()
 ]);
 const failed=(r:PromiseSettledResult<unknown>):string|null=>
  r.status==="rejected"?(r.reason instanceof Error?r.reason.message:"Backend source unavailable"):null;
 const pinnedValue=pinned.status==="fulfilled"&&pinned.value?pinned.value:
  {state:"failed" as const,data:null,error:failed(pinned)??"Pinned source disabled."};
 const catalogValue=catalog.status==="fulfilled"&&catalog.value?catalog.value:
  {data:null,error:failed(catalog)??"Operational catalog disabled."};
 const operationsValue=operations.status==="fulfilled"?operations.value:{
  source:"disconnected" as const,error:failed(operations)??"Operations unavailable",
  snapshot:{connection:"not_connected" as const,checkedAt:null,latestDataThrough:null,nextScheduledRun:null,runs:[]}
 };
 const freshnessValue=freshness.status==="fulfilled"?freshness.value:{
  source:"disconnected" as const,report:null,error:failed(freshness)??"Freshness unavailable"
 };
 const alertsValue=alerts.status==="fulfilled"?alerts.value:{
  source:"disconnected" as const,error:failed(alerts)??"Alerts unavailable",data:{alerts:[]}
 };
 const schedulerValue=scheduler.status==="fulfilled"?scheduler.value:{
  data:null,error:failed(scheduler)??"Scheduler diagnostics unavailable"
 };
 const coverage=research.status==="fulfilled"?research.value:null;
 const screenerValue=screener.status==="fulfilled"?screener.value:null;
 const inputs:TraceInputs={
  mode,pinned:pinnedValue,catalog:catalogValue,operations:operationsValue,
  freshness:freshnessValue,alerts:alertsValue,scheduler:schedulerValue,
  research:coverage?{
   universe:coverage.universe,unresolvedSecurities:coverage.unresolvedSecurities,
   unexplainedTickerSessions:coverage.unexplainedTickerSessions
  }:null,
  researchError:failed(research)??(mode==="http"&&!dataSource?"Research API base URL is not configured.":null),
  screener:{
   count:screenerValue?.data.entries.length??0,
   error:failed(screener)??screenerValue?.error??null,
   source:screenerValue?.source??"disconnected"
  }
 };
 const stages=createOperationsTrace(inputs);
 const unknown=stages.filter(stage=>stage.state==="unavailable"||stage.state==="blocked").length;
 return <>
  <Link href="/operations" className="back-link">← Back to operations</Link>
  <PageHeader eyebrow="Read-only operations" title="Collection to research evidence trace"
   badge={mode!=="http"?"Demonstration disconnected":unknown?"Review required":"Recorded evidence"}
   description="Trace original KRX collection, scheduler gates, execution records, freshness, alerts and separate research publications. Every stage independently reports its available evidence; no completion, quality, or approval is inferred."/>
  <section className="panel single-panel" aria-label="Evidence chain overview">
   <div className="panel-heading"><h2>Evidence chain</h2><span className="panel-count">{stages.length} stages</span></div>
   <p className="section-copy">Backend mode: {mode}. Operational records are unreviewed. A validated research snapshot is not the same dataset as the pinned operational SQLite snapshot. No stage can silently promote raw collection into approved predictions.</p>
   <div className="operations-overview-grid">
    <div className="operations-overview-stat"><span>Stages needing review</span><strong>{unknown}</strong></div>
    <div className="operations-overview-stat"><span>Recorded/observed states</span><strong>{stages.filter(stage=>stage.state==="observed").length}</strong></div>
    <div className="operations-overview-stat"><span>Empty stages</span><strong>{stages.filter(stage=>stage.state==="empty").length}</strong></div>
    <div className="operations-overview-stat"><span>Approval</span><strong>Not inferred</strong></div>
   </div>
   <p className="metric-detail">Counts describe displayed stage statuses only, not ingestion success rate or live provider readiness.</p>
  </section>
  <section className="panel single-panel" aria-label="Collection and research trace stages">
   <div className="panel-heading"><h2>Recorded evidence and blocking conditions</h2><span className="panel-count">Source-specific</span></div>
   {stages.map((stage,index)=><article className="operations-run" key={stage.key}>
    <div>
     <strong>{index+1}. {stage.title}</strong>
     <p className="metric-detail">{stage.detail}</p>
     <p><Link href={stage.link}>Inspect source evidence</Link></p>
    </div>
    <span className="status-pill" data-state={stage.state==="observed"?"verified":stage.state==="blocked"?"blocked":"in_progress"}>{stage.state}</span>
   </article>)}
  </section>
  <section className="panel single-panel" aria-label="Evidence limitations">
   <h2>Verification boundaries</h2>
   <p className="section-copy">A GET-only API response confirms that the backend exposed a recorded projection. It does not prove exchange-session completeness, point-in-time integrity, prediction accuracy, investment suitability, or live trading readiness. Missing provider configuration is shown as unavailable rather than supplied with demo data.</p>
   <p><Link href="/diagnostics">Inspect connection and source errors</Link></p>
  </section>
 </>;
}
