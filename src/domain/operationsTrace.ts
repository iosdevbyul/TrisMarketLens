import type {PinnedSummaryResult} from "../data/PinnedMarketSummaryDataSource";
import type {OperationalResult,OperationalCatalog} from "../data/OperationalMarketDataSource";
import type {OperationsResult} from "../data/OperationsDataSource";
import type {FreshnessResult} from "../data/FreshnessDataSource";
import type {AlertResult} from "../data/OperationalAlertsDataSource";
import type {SchedulerDiagnosticsResult} from "../data/KrxSchedulerDiagnosticsDataSource";

export type TraceState="observed"|"empty"|"blocked"|"unavailable"|"demo";
export interface TraceStage{key:string;title:string;state:TraceState;detail:string;link:string;}
export interface TraceInputs{
 mode:string;
 pinned:PinnedSummaryResult;
 catalog:OperationalResult<OperationalCatalog>;
 operations:OperationsResult;
 freshness:FreshnessResult;
 alerts:AlertResult;
 scheduler:SchedulerDiagnosticsResult;
 research:{universe:number;unresolvedSecurities:number;unexplainedTickerSessions:number}|null;
 researchError:string|null;
 screener:{count:number;error:string|null;source:string};
}
export function createOperationsTrace(input:TraceInputs):TraceStage[]{
 if(input.mode!=="http")return [
  {key:"configuration",title:"Research source",state:"demo",
   detail:"HTTP backend is not selected. All downstream source states are unverified; demonstration figures are not market observations.",
   link:"/diagnostics"}
 ];
 const stages:TraceStage[]=[];
 const summary=input.pinned.data;
 const catalog=input.catalog.data;
 const summaryError=input.pinned.error;
 stages.push({key:"collection",title:"Pinned KRX observation coverage",
  state:input.pinned.state==="available"?"observed":input.pinned.state==="empty"?"empty":"unavailable",
  detail:summary
   ?summary.observationCount+" original rows across "+summary.tickerCount+" tickers and "+summary.tradingDayCount+
    " recorded dates; "+(summary.firstTradingDate??"unknown")+" to "+(summary.lastTradingDate??"unknown")+
    ". The observations remain unreviewed."
   :summaryError??"No pinned operational snapshot.",
  link:"/operational-market"});
 stages.push({key:"catalog",title:"Ticker collection cross-check",
  state:!catalog?"unavailable":summary&&catalog.total!==summary.tickerCount?"blocked":
   catalog.total===0?"empty":"observed",
  detail:!catalog?input.catalog.error??"Catalog not available":
   summary&&summary.tickerCount!==catalog.total?"Pinned summary and catalog ticker counts differ; investigate source integrity.":
   "Catalog reports "+catalog.total+" distinct tickers; "+catalog.items.length+" shown on first page. Unreviewed and not a market completeness certificate.",
  link:"/operational-market"});
 const diag=input.scheduler.data;
 stages.push({key:"scheduler",title:"Collection scheduling and manual gate",
  state:!diag?"unavailable":diag.status==="no_due_sessions"?"observed":"blocked",
  detail:diag?
   "Backend status "+diag.status+"; due "+diag.dueSessions+", expired "+diag.expiredSessions+
   ", unresolved reservations "+diag.reservedWithoutVerifiedCompletion+
   ". Manual operator confirmation remains required; scheduler flags do not prove a run occurred."
   :input.scheduler.error??"Scheduler diagnostics not configured.",
  link:"/operations"});
 const ops=input.operations;
 stages.push({key:"runEvidence",title:"Recorded acquisition and validation outcomes",
  state:ops.source!=="http"||ops.error?"unavailable":ops.snapshot.runs.length===0?"empty":"observed",
  detail:ops.error??(ops.source!=="http"?"Read-only operation evidence not connected":
   ops.snapshot.runs.length+" returned execution records. Recorded completion never grants semantic approval."),
  link:"/operations"});
 stages.push({key:"freshness",title:"Acquisition-age evidence",
  state:input.freshness.source!=="http"||input.freshness.error?"unavailable":
   input.freshness.report?.validatedThrough?"observed":"empty",
  detail:input.freshness.error??(input.freshness.source!=="http"?"Freshness source unavailable":
   "Latest recorded date: "+(input.freshness.report?.validatedThrough??"unknown")+
   ". No exchange-calendar completeness or investment suitability is inferred."),
  link:"/diagnostics"});
 stages.push({key:"alerts",title:"Recorded operational blockers",
  state:input.alerts.source!=="http"||input.alerts.error?"unavailable":
   input.alerts.data.alerts.length>0?"blocked":"observed",
  detail:input.alerts.error??(input.alerts.source!=="http"?"Alerts source unavailable":
   input.alerts.data.alerts.length+" returned alert records (first bounded page). A zero result does not certify an incident-free history."),
  link:"/operations"});
 const research=input.research;
 stages.push({key:"research",title:"Published research universe and provenance",
  state:input.researchError||!research?"unavailable":
   research.unresolvedSecurities>0||research.unexplainedTickerSessions>0?"blocked":"observed",
  detail:research?
   research.universe+" research securities, "+research.unresolvedSecurities+" unresolved identities, "+
   research.unexplainedTickerSessions+" unexplained ticker sessions. Coverage belongs to a separate reviewed research source."
   :input.researchError??"Published research coverage unavailable.",
  link:"/evidence"});
 stages.push({key:"analysis",title:"Explicit per-security analysis publication",
  state:input.screener.source!=="http"||input.screener.error?"unavailable":
   input.screener.count===0?"empty":"observed",
  detail:input.screener.error??(input.screener.source!=="http"?"Published analysis source not connected":
   input.screener.count+" published analysis records. These are not inferred from collection rows or global model statistics."),
  link:"/research-workbench"});
 return stages;
}
