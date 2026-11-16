import { Localize } from "@/i18n/Localize";
import { getTranslator } from "@/i18n/server";
import type { SchedulerDiagnosticsResult } from "@/data/KrxSchedulerDiagnosticsDataSource";
export async function KrxSchedulerDiagnosticsPanel({result}:{result:SchedulerDiagnosticsResult}) {
 const t=await getTranslator();
 const d=result.data;
 return <section className="panel single-panel" aria-label="KRX scheduler diagnostics">
   <div className="panel-heading"><div><p className="eyebrow"><Localize text="KRX operations" /></p><h2><Localize text="Scheduler diagnostics" /></h2></div>
     <span className="status-pill" data-state={!d?"blocked":d.status==="no_due_sessions"?"verified":"in_progress"}>{t(d?d.status.replaceAll("_"," "):"Unavailable")}</span></div>
   <p className="section-copy"><Localize text="Read-only operator-provided diagnostic reports. This panel does not start collections, approve evidence, or enable PAPER trading." /></p>
   {result.error?<div className="run-lock" role="status"><p><Localize text="Diagnostics unavailable" /></p><span>{result.error}</span></div>:null}
   {d?<><div className="operations-overview-grid">
     {[
       ["Scheduler enabled",d.schedulerEnabled?"Yes":"No"],
       ["Stored observations",d.storedObservations.toLocaleString()],
       ["Last persisted trading date",d.lastPersistedTradingDate??"Unknown"],
       ["Due sessions",String(d.dueSessions)],
       ["Expired sessions",String(d.expiredSessions)],
       ["Completed sessions",String(d.completedSessions)],
       ["Unverified stored history",String(d.storedWithoutVerifiedHistory)],
       ["Reserved without verified completion",String(d.reservedWithoutVerifiedCompletion)],
       ["Oldest due date",d.oldestDueDate??"Unknown"],
       ["Storage capacity",d.storageCapacityReady===null?"Unknown":d.storageCapacityReady?"Ready":"Not ready"],
       ["Manual capture readiness",d.readyForManualCapture?"Reported ready":"Not ready"],
       ["Scheduled collection readiness",d.readyForScheduledCollection?"Reported ready":"Not ready"],
     ].map(([label,value])=><div className="operations-overview-stat" key={label}><span>{t(label)}</span><strong>{t(value)}</strong></div>)}
   </div><p className="metric-detail">{t("Preflight blockers:")} {d.preflightBlockers.length}. {t("Operator confirmation is still required. This diagnostic API made no network requests or scheduler changes.")}</p>
   {d.preflightBlockers.length>0?<p className="metric-detail" role="status"><Localize text="Review the backend operator reports for the full preflight blockers; details are deliberately not exposed here."/></p>:null}
   </>:null}
 </section>;
}
