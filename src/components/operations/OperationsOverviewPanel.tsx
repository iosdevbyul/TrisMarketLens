import type {OperationsOverview} from "@/domain/operationsOverview";
import {translate,type Locale} from "@/i18n/translations";
export function OperationsOverviewPanel({overview,locale,demonstration}:{overview:OperationsOverview;locale:Locale;demonstration:boolean}){
 const t=(s:string)=>translate(locale,s);
 const labels={unknown:"Unknown",attention:"Needs attention",active:"In progress",reported_healthy:"Reported healthy",reported_success:"Reported successful",current:"Current",delayed:"Delayed"} as const;
 return <section className="panel single-panel operations-overview" aria-label={t("Operations overview")}>
  <div className="panel-heading"><div><p className="eyebrow">{t("Operations")}</p><h2>{t("Operations overview")}</h2></div>
   <span className="status-pill" data-state={overview.state==="reported_healthy"?"verified":overview.state==="attention"?"blocked":"in_progress"}>{t(labels[overview.state])}</span></div>
  <p className="section-copy">{t("Overall state summarizes received reports only; it does not certify live system health.")}</p>
  {demonstration?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("At least one overview input contains fictional demo records.")}</span></div>:null}
  <div className="operations-overview-grid">
   {[
    ["Pipeline health",t(labels[overview.pipeline])],
    ["Data freshness",t(labels[overview.freshness])],
    ["Open alerts",overview.openAlerts===null?"—":String(overview.openAlerts)],
    ["Critical open alerts",overview.criticalAlerts===null?"—":String(overview.criticalAlerts)],
   ].map(([label,value])=><div className="operations-overview-stat" key={label}><span>{t(label)}</span><strong>{value}</strong></div>)}
  </div>
  {!overview.sourcesComplete?<p className="metric-detail">{t("One or more sources are missing or unavailable. Unknown is not healthy.")}</p>:null}
 </section>;
}
