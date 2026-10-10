"use client";
import {useMemo,useState} from "react";
import type {AlertResult} from "@/data/OperationalAlertsDataSource";
import {filterOperationalAlerts,type AlertSeverity} from "@/domain/operationalAlerts";
import {translate,type Locale} from "@/i18n/translations";
export function OperationalAlertsPanel({result,locale}:{result:AlertResult;locale:Locale}){
 const t=(s:string)=>translate(locale,s);
 const [status,setStatus]=useState<"all"|"open"|"resolved">("all");
 const [severity,setSeverity]=useState<"all"|AlertSeverity>("all");
 const alerts=useMemo(()=>filterOperationalAlerts(result.data.alerts,status,severity),[result.data.alerts,status,severity]);
 const format=(value:string)=>new Intl.DateTimeFormat(locale==="ko"?"ko-KR":"en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Seoul"}).format(new Date(value));
 return <section className="panel single-panel operational-alerts">
  <div className="panel-heading"><div><p className="eyebrow">{t("Operations")}</p><h2>{t("Operational alerts")}</h2></div><span className="panel-count">{result.data.alerts.length} {t("alerts")}</span></div>
  {result.source==="mock"?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("These alerts are fictional examples, not live incidents.")}</span></div>:null}
  {result.error?<div className="run-lock" role="alert"><p>{t("Alerts unavailable")}</p><span>{result.error}</span></div>:null}
  <p className="section-copy">{t("Alerts are read-only backend records. This screen does not send notifications or resolve incidents.")}</p>
  <div className="operational-alerts-filters">
   <label>{t("Alert status")}<select value={status} onChange={e=>setStatus(e.target.value as typeof status)}><option value="all">{t("All states")}</option><option value="open">{t("Open")}</option><option value="resolved">{t("Resolved")}</option></select></label>
   <label>{t("Severity")}<select value={severity} onChange={e=>setSeverity(e.target.value as typeof severity)}><option value="all">{t("All severities")}</option><option value="info">{t("Info")}</option><option value="warning">{t("Warning")}</option><option value="critical">{t("Critical")}</option></select></label>
  </div>
  {alerts.length===0?<p className="section-copy">{t("No alert records match this view.")}</p>:
   <div className="operational-alerts-list">{alerts.map(alert=><article key={alert.id} className="operational-alert-item">
    <div className="stock-analysis-heading"><div><strong>{alert.title}</strong><p className="metric-detail">{t(alert.category==="freshness"?"Data freshness":alert.category==="pipeline"?"Pipeline health":alert.category==="inference"?"Model inference":"Other")} · {format(alert.occurredAt)}</p></div>
     <span className="status-pill" data-state={alert.status==="resolved"?"verified":alert.severity==="critical"?"blocked":"in_progress"}>{t(alert.status==="open"?"Open":"Resolved")} · {t(alert.severity==="info"?"Info":alert.severity==="warning"?"Warning":"Critical")}</span></div>
    <p className="section-copy">{t(alert.description)}</p>
    <p className="metric-detail">{t("Related run")}: {alert.relatedRunId??"—"} · {t("Resolved at")}: {alert.resolvedAt?format(alert.resolvedAt):"—"}</p>
   </article>)}</div>}
 </section>;
}
