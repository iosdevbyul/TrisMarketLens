import type { OperationsResult } from "@/data/OperationsDataSource";
import { derivePipelineHealth } from "@/domain/pipelineHealth";
import { translate,type Locale } from "@/i18n/translations";

export function PipelineHealthPanel({result,locale}:{result:OperationsResult;locale:Locale}) {
 const t=(value:string)=>translate(locale,value);
 const health=derivePipelineHealth(result.snapshot);
 const formatTime=(value:string|null)=>value?new Intl.DateTimeFormat(locale==="ko"?"ko-KR":"en-US",{timeZone:"Asia/Seoul",dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";
 const stateLabels={unknown:"Unknown",attention:"Needs attention",active:"In progress",reported_success:"Reported successful"} as const;
 const stageLabels={collection:"Market collection",validation:"Market validation",inference:"Model inference"} as const;
 const runStates={queued:"Queued",running:"Running",succeeded:"Succeeded",failed:"Failed",blocked:"Blocked",unknown:"Unknown"} as const;
 return <section className="panel single-panel pipeline-health" aria-label={t("Pipeline health")}>
  <div className="panel-heading"><div><p className="eyebrow">{t("Operations")}</p><h2>{t("Pipeline health")}</h2></div>
   <span className="panel-count">{t(stateLabels[health.state])}</span></div>
  <p className="section-copy">{t("States describe reported jobs only. Data timeliness and completion are not independently certified.")}</p>
  <div className="pipeline-health-summary">
   <div><span>{t("Last status check")}</span><strong>{formatTime(health.checkedAt)}</strong></div>
   <div><span>{t("Latest validated market data")}</span><strong>{health.latestValidatedData??"—"}</strong></div>
  </div>
  <div className="pipeline-stage-grid">{health.stages.map(stage=><article className="pipeline-stage" key={stage.stage}>
   <div className="pipeline-stage-title"><strong>{t(stageLabels[stage.stage])}</strong>
    <span className="status-pill" data-state={stage.state==="succeeded"?"verified":stage.state==="failed"||stage.state==="blocked"?"blocked":"in_progress"}>{t(runStates[stage.state])}</span></div>
   <dl>
    <div><dt>{t("Latest run")}</dt><dd>{stage.latestRun?.id??"—"}</dd></div>
    <div><dt>{t("Last successful completion")}</dt><dd>{formatTime(stage.latestSuccessAt)}</dd></div>
    <div><dt>{t("Successful data through")}</dt><dd>{stage.latestSuccessDataThrough??"—"}</dd></div>
   </dl>
  </article>)}</div>
  {result.source==="mock"?<p className="metric-detail">{t("Pipeline status uses fictional demonstration runs.")}</p>:null}
 </section>;
}
