"use client";
import {useEffect,useState} from "react";
import {filterRunsRequiringAttention} from "../../domain/operationsAttention";
import {parseSharedRunFilters,serializeSharedRunFilters} from "../../domain/sharedRunFilters";
import {evidenceCategories,summarizeRecordedEvidence} from "../../domain/recordedEvidenceSummary";
import {filterByRecordedEvidence,type RecordedEvidence} from "../../domain/recordedEvidence";
import {recordedStates,summarizeReturnedRunStates} from "../../domain/recordedRunSummary";
import {recordedRunDuration} from "../../domain/recordedRunDuration";
import {exportRecordedRunsCsv} from "../../domain/operationsCsv";
import type {AnalysisRun,AnalysisRunState} from "@/domain/operations";

export type RunFilter="all"|"Market collection"|"DART session"|"DART batch acquisition"|"other";
export function filterRecordedRuns(runs:readonly AnalysisRun[],pipeline:RunFilter,state:"all"|AnalysisRunState,query=""){
 const needle=query.trim().toLocaleLowerCase();
 return runs.filter(run=>(!needle||[run.id,run.pipeline,run.summary??""].some(value=>value.toLocaleLowerCase().includes(needle)))&&(pipeline==="all"||(pipeline==="other"?!["Market collection","DART session","DART batch acquisition"].includes(run.pipeline):run.pipeline===pipeline))&&(state==="all"||run.state===state));
}
export type RunSort="newest"|"oldest"|"duration-longest"|"duration-shortest";
function elapsedMilliseconds(run:AnalysisRun):number|null{
 if(!run.startedAt||!run.finishedAt)return null;
 const start=Date.parse(run.startedAt),end=Date.parse(run.finishedAt);
 return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?end-start:null;
}
export function sortRecordedRuns(runs:readonly AnalysisRun[],sort:RunSort):AnalysisRun[]{
 return [...runs].sort((a,b)=>{
  if(sort==="duration-longest"||sort==="duration-shortest"){
   const aDuration=elapsedMilliseconds(a),bDuration=elapsedMilliseconds(b);
   if(aDuration===null)return bDuration===null?0:1;
   if(bDuration===null)return -1;
   return sort==="duration-longest"?bDuration-aDuration:aDuration-bDuration;
  }
  const at=a.startedAt?Date.parse(a.startedAt):NaN,bt=b.startedAt?Date.parse(b.startedAt):NaN;
  if(!Number.isFinite(at)&&!Number.isFinite(bt))return 0;
  if(!Number.isFinite(at))return 1;
  if(!Number.isFinite(bt))return -1;
  return sort==="newest"?bt-at:at-bt;
 });
}
export function filterRunsByStartDate(runs:readonly AnalysisRun[],from:string,to:string):AnalysisRun[]{
 return runs.filter(run=>{
  if(!from&&!to)return true;
  if(!run.startedAt)return false;
  const day=new Date(run.startedAt).toISOString().slice(0,10);
  return (!from||day>=from)&&(!to||day<=to);
 });
}
const states:AnalysisRunState[]=["queued","running","succeeded","failed","blocked","unknown"];
export function RecordedRunExplorer({runs,locale}:{runs:AnalysisRun[];locale:"ko"|"en"}){
 const [pipeline,setPipeline]=useState<RunFilter>("all");
 const [query,setQuery]=useState("");
 const [state,setState]=useState<"all"|AnalysisRunState>("all");
 const [sort,setSort]=useState<RunSort>("newest");
 const [evidence,setEvidence]=useState<RecordedEvidence|"all">("all");
 const [from,setFrom]=useState("");
 const [to,setTo]=useState("");
 const [attentionOnly,setAttentionOnly]=useState(false);
 const [copiedRunId,setCopiedRunId]=useState<string|null>(null);
 const [copyError,setCopyError]=useState<string|null>(null);
 const [shareStatus,setShareStatus]=useState<string|null>(null);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   const saved=parseSharedRunFilters(window.location.search);
  setPipeline(saved.pipeline as RunFilter);
  setQuery(saved.query);
  setState(saved.state as AnalysisRunState|"all");
  setSort(saved.sort as RunSort);
  setEvidence(saved.evidence as RecordedEvidence|"all");
  setFrom(saved.from);
  setTo(saved.to);
  setAttentionOnly(saved.attention);
  },0);
  return ()=>window.clearTimeout(timer);
 },[]);
 const shareFilters=async()=>{
  const queryString=serializeSharedRunFilters(window.location.search,{query,pipeline,state,sort,evidence,from,to,attention:attentionOnly});
  const url=new URL(window.location.href);
  url.search=queryString;
  window.history.replaceState(window.history.state,"",url.toString());
  try{await navigator.clipboard.writeText(url.toString());setShareStatus("Link copied");}
  catch{setShareStatus("Link updated in address bar; clipboard unavailable");}
 };
 const copyRunId=async(id:string)=>{
  try{await navigator.clipboard.writeText(id);setCopiedRunId(id);setCopyError(null);}
  catch{setCopyError(id);setCopiedRunId(null);}
 };
 const counts=summarizeReturnedRunStates(runs);
 const evidenceCounts=summarizeRecordedEvidence(runs);
 const visible=sortRecordedRuns(filterRunsRequiringAttention(filterByRecordedEvidence(filterRunsByStartDate(filterRecordedRuns(runs,pipeline,state,query),from,to),evidence),attentionOnly),sort);
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
  <div className="recorded-run-summary" aria-label="Returned execution status summary">
   {recordedStates.map(item=><button type="button" key={item} aria-pressed={state===item} aria-label={`Filter ${item} recorded executions (${counts[item]})`} onClick={()=>setState(current=>current===item?"all":item)}><span>{item}</span><strong>{counts[item]}</strong></button>)}
  </div>
  <p className="metric-detail">Select a status count to filter the records below; select it again to clear that status. Status totals describe only the {runs.length} execution records returned by this API request, not the complete execution history. A recorded completed operation does not establish semantic approval.</p>
  <div className="recorded-run-summary" aria-label="Returned evidence status summary">
   {evidenceCategories.map(item=><button type="button" key={item} aria-pressed={evidence===item} aria-label={`Filter ${item} evidence records (${evidenceCounts[item]})`} onClick={()=>setEvidence(current=>current===item?"all":item)}><span>{item}</span><strong>{evidenceCounts[item]}</strong></button>)}
  </div>
  <p className="metric-detail">Evidence totals describe only the {runs.length} returned executions. Missing or malformed evidence labels are counted as not recorded, not validated. Select a count to filter; select again to clear.</p>
  <div className="recorded-run-filters">
   <label className="recorded-run-attention"><input type="checkbox" checked={attentionOnly} onChange={e=>setAttentionOnly(e.target.checked)} /> Needs attention only</label>
   <label>Start date from (UTC)<input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)} /></label>
   <label>Start date to (UTC)<input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)} /></label>
   <label>Search recorded execution<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Run ID, source, diagnostic" autoComplete="off" /></label>
   <label>Pipeline<select value={pipeline} onChange={e=>setPipeline(e.target.value as RunFilter)}>
    <option value="all">All pipelines</option><option value="Market collection">Market collection</option>
    <option value="DART session">DART session</option><option value="DART batch acquisition">DART batch acquisition</option>
    <option value="other">Other recorded pipelines</option>
   </select></label>
   <label>Recorded status<select value={state} onChange={e=>setState(e.target.value as AnalysisRunState|"all")}>
    <option value="all">All statuses</option>{states.map(item=><option key={item} value={item}>{item}</option>)}
   </select></label>
   <label>Recorded evidence<select value={evidence} onChange={e=>setEvidence(e.target.value as RecordedEvidence|"all")}>
    <option value="all">All evidence</option><option value="validated">Validated</option><option value="partial">Partial</option><option value="invalid">Invalid</option><option value="unavailable">Unavailable</option><option value="not-recorded">Not recorded</option>
   </select></label>
   <label>Sort execution records<select value={sort} onChange={e=>setSort(e.target.value as RunSort)}>
    <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="duration-longest">Longest duration first</option><option value="duration-shortest">Shortest duration first</option>
   </select></label>
   <button type="button" className="recorded-run-reset" onClick={()=>void shareFilters()}>Copy filter link</button>
   <button type="button" className="recorded-run-reset" onClick={downloadCsv} disabled={visible.length===0}>Export filtered CSV</button>
   <button type="button" className="recorded-run-reset" onClick={()=>{setQuery("");setPipeline("all");setState("all");setSort("newest");setFrom("");setTo("");setEvidence("all");setAttentionOnly(false);}} disabled={!query&&!from&&!to&&pipeline==="all"&&state==="all"&&sort==="newest"&&evidence==="all"&&!attentionOnly}>Reset filters</button>
  </div>
  {shareStatus?<p role="status" className="metric-detail">{shareStatus}</p>:null}
  <p className="metric-detail" role="status">Showing {visible.length} of {runs.length} returned execution records. Needs attention includes recorded failures, blocked executions, invalid evidence or unavailable evidence; it does not imply a complete history. Evidence classifications are parsed only from explicitly recorded backend diagnostics; missing evidence is not treated as valid. Date filters use UTC dates of recorded start times. Records without start times are excluded when a date range is selected. Filters and CSV export apply only to returned records; the API may contain additional records beyond its first 25.</p>
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
        <div><dt>Recorded elapsed time</dt><dd>{recordedRunDuration(run)??"Unavailable"}</dd></div>
        <div><dt>Data through</dt><dd>{run.dataThrough??"Not verified"}</dd></div>
        <div><dt>Recorded evidence and diagnostics</dt><dd>{run.summary??"No diagnostic supplied"}</dd></div>
      </dl>
      <p className="metric-detail">Recorded execution status is not proof of approved acquisition or research validation.</p>
    </details>
   </article>)}</div>}
 </div>;
}
