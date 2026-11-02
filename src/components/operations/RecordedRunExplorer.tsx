"use client";
import {useState} from "react";
import {exportRecordedRunsCsv} from "../../domain/operationsCsv";
import type {AnalysisRun,AnalysisRunState} from "@/domain/operations";

export type RunFilter="all"|"Market collection"|"DART session"|"DART batch acquisition"|"other";
export function filterRecordedRuns(runs:readonly AnalysisRun[],pipeline:RunFilter,state:"all"|AnalysisRunState,query=""){
 const needle=query.trim().toLocaleLowerCase();
 return runs.filter(run=>(!needle||[run.id,run.pipeline,run.summary??""].some(value=>value.toLocaleLowerCase().includes(needle)))&&(pipeline==="all"||(pipeline==="other"?!["Market collection","DART session","DART batch acquisition"].includes(run.pipeline):run.pipeline===pipeline))&&(state==="all"||run.state===state));
}
export type RunSort="newest"|"oldest";
export function sortRecordedRuns(runs:readonly AnalysisRun[],sort:RunSort):AnalysisRun[]{
 return [...runs].sort((a,b)=>{
  const at=a.startedAt?Date.parse(a.startedAt):NaN,bt=b.startedAt?Date.parse(b.startedAt):NaN;
  if(!Number.isFinite(at)&&!Number.isFinite(bt))return 0;
  if(!Number.isFinite(at))return 1;
  if(!Number.isFinite(bt))return -1;
  return sort==="newest"?bt-at:at-bt;
 });
}
const states:AnalysisRunState[]=["queued","running","succeeded","failed","blocked","unknown"];
export function RecordedRunExplorer({runs,locale}:{runs:AnalysisRun[];locale:"ko"|"en"}){
 const [pipeline,setPipeline]=useState<RunFilter>("all");
 const [query,setQuery]=useState("");
 const [state,setState]=useState<"all"|AnalysisRunState>("all");
 const [sort,setSort]=useState<RunSort>("newest");
 const [copiedRunId,setCopiedRunId]=useState<string|null>(null);
 const [copyError,setCopyError]=useState<string|null>(null);
 const copyRunId=async(id:string)=>{
  try{await navigator.clipboard.writeText(id);setCopiedRunId(id);setCopyError(null);}
  catch{setCopyError(id);setCopiedRunId(null);}
 };
 const visible=sortRecordedRuns(filterRecordedRuns(runs,pipeline,state,query),sort);
 const downloadCsv=()=>{
  const csv=exportRecordedRunsCsv(visible);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-recorded-runs.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
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
   <label>Sort by start time<select value={sort} onChange={e=>setSort(e.target.value as RunSort)}>
    <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
   </select></label>
   <button type="button" className="recorded-run-reset" onClick={downloadCsv} disabled={visible.length===0}>Export filtered CSV</button>
   <button type="button" className="recorded-run-reset" onClick={()=>{setQuery("");setPipeline("all");setState("all");setSort("newest");}} disabled={!query&&pipeline==="all"&&state==="all"&&sort==="newest"}>Reset filters</button>
  </div>
  <p className="metric-detail" role="status">Showing {visible.length} of {runs.length} returned execution records. Filters and CSV export apply only to returned records; the API may contain additional records beyond its first 25.</p>
  {visible.length===0?<p className="section-copy">No recorded executions match these filters.</p>:
   <div className="operations-runs">{visible.map(run=><article className="operations-run" key={run.id}>
    <div><strong>{run.pipeline}</strong><p className="metric-detail">{run.id} · {run.dataThrough??"—"}</p><button className="recorded-run-copy" type="button" onClick={()=>void copyRunId(run.id)} aria-label={"Copy run ID "+run.id}>Copy run ID</button>{copiedRunId===run.id?<span className="metric-detail" role="status">Copied</span>:null}{copyError===run.id?<span className="metric-detail" role="alert">Copy unavailable</span>:null}</div>
    <div><span className="status-pill" data-state={run.state==="succeeded"?"verified":run.state==="running"||run.state==="queued"?"in_progress":"blocked"}>{run.state}</span><p className="metric-detail">{formatTime(run.startedAt)}</p></div>
    <details className="recorded-run-details"><summary>Inspect recorded details</summary>
      <dl>
        <div><dt>Run ID</dt><dd>{run.id}</dd></div>
        <div><dt>Pipeline</dt><dd>{run.pipeline}</dd></div>
        <div><dt>Recorded status</dt><dd>{run.state}</dd></div>
        <div><dt>Started at</dt><dd>{formatTime(run.startedAt)}</dd></div>
        <div><dt>Finished at</dt><dd>{formatTime(run.finishedAt)}</dd></div>
        <div><dt>Data through</dt><dd>{run.dataThrough??"Not verified"}</dd></div>
        <div><dt>Recorded evidence and diagnostics</dt><dd>{run.summary??"No diagnostic supplied"}</dd></div>
      </dl>
      <p className="metric-detail">Recorded execution status is not proof of approved acquisition or research validation.</p>
    </details>
   </article>)}</div>}
 </div>;
}
