import type { SchedulerDiagnosticsResult } from "@/data/KrxSchedulerDiagnosticsDataSource";
export function KrxSchedulerDiagnosticsPanel({result}:{result:SchedulerDiagnosticsResult}) {
 const d=result.data;
 return <section className="panel single-panel" aria-label="KRX scheduler diagnostics">
   <div className="panel-heading"><div><p className="eyebrow">KRX operations</p><h2>Scheduler diagnostics</h2></div>
     <span className="status-pill" data-state={!d?"blocked":d.status==="no_due_sessions"?"verified":"in_progress"}>{d?d.status.replaceAll("_"," "):"Unavailable"}</span></div>
   <p className="section-copy">Read-only operator-provided diagnostic reports. This panel does not start collections, approve evidence, or enable PAPER trading.</p>
   {result.error?<div className="run-lock" role="status"><p>Diagnostics unavailable</p><span>{result.error}</span></div>:null}
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
     ].map(([label,value])=><div className="operations-overview-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
   </div><p className="metric-detail">Preflight blockers: {d.preflightBlockers.length}. Operator confirmation is still required. No network requests or scheduler changes were made by this diagnostic API.</p>
   {d.preflightBlockers.length>0?<p className="metric-detail" role="status">Review the backend operator reports for the full preflight blockers; details are deliberately not exposed here.</p>:null}
   </>:null}
 </section>;
}
