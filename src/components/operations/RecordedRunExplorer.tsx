"use client";
import {useState} from "react";
import type {AnalysisRun,AnalysisRunState} from "@/domain/operations";

export type RunFilter="all"|"Market collection"|"DART session"|"DART batch acquisition"|"other";
export function filterRecordedRuns(runs:readonly AnalysisRun[],pipeline:RunFilter,state:"all"|AnalysisRunState,query=""){
 const needle=query.trim().toLocaleLowerCase();
 return runs.filter(run=>(!needle||[run.id,run.pipeline,run.summary??""].some(value=>value.toLocaleLowerCase().includes(needle)))&&(pipeline==="all"||(pipeline==="other"?!["Market collection","DART session","DART batch acquisition"].includes(run.pipeline):run.pipeline===pipeline))&&(state==="all"||run.state===state));
}
const states:AnalysisRunState[]=["queued","running","succeeded","failed","blocked","unknown"];
export function RecordedRunExplorer({runs,locale}:{runs:AnalysisRun[];locale:"ko"|"en"}){
 const [pipeline,setPipeline]=useState<RunFilter>("all");
 const [query,setQuery]=useState("");
 const [state,setState]=useState<"all"|AnalysisRunState>("all");
 const visible=filterRecordedRuns(runs,pipeline,state,query);
 const formatTime=(value:string|null)=>value?new Intl.DateTimeFormat(locale==="ko"?"ko-KR":"en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Seoul"}).format(new Date(value)):"—";
 return <div className="recorded-run-explorer">
  <div className="recorded-run-filters">
   <label>Search recorded execution<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Run ID, source, diagnostic" autoComplete="off" /></label>
   <label>Pipeline<select value={pipeline} onChange={e=>setPipeline(e.target.value as RunFilter)}>
    <option value="all">All pipelines</option><option value="Market collection">Market collection</option>
    <option value="DART session">DART session</option><option value="DART batch acquisition">DART batch acquisition</option>
    <option value="other">Other recorded pipelines</option>
   </select></label>
   <label>Recorded status<select value={state} onChange={e=>setState(e.target.value as AnalysisRunState|"all")}>
    <option value="all">All statuses</option>{states.map(item=><option key={item} value={item}>{item}</option>)}
   </select></label>
  </div>
  <p className="metric-detail" role="status">Showing {visible.length} of {runs.length} returned execution records. Filters are local to this page; the API may contain additional records beyond its first 25.</p>
  {visible.length===0?<p className="section-copy">No recorded executions match these filters.</p>:
   <div className="operations-runs">{visible.map(run=><article className="operations-run" key={run.id}>
    <div><strong>{run.pipeline}</strong><p className="metric-detail">{run.id} · {run.dataThrough??"—"}</p></div>
    <div><span className="status-pill" data-state={run.state==="succeeded"?"verified":run.state==="running"||run.state==="queued"?"in_progress":"blocked"}>{run.state}</span><p className="metric-detail">{formatTime(run.startedAt)}</p></div>
    {run.summary?<p className="metric-detail operations-run-summary">{run.summary}</p>:null}
   </article>)}</div>}
 </div>;
}
