"use client";
import {useEffect,useState} from "react";
import {selectMatrixRow,selectMatrixColumn} from "../../domain/matrixMarginSelection";
import {summarizeStatusEvidenceMatrix,statusEvidenceMatrixTotals} from "../../domain/statusEvidenceMatrix";
import {formatRecordedRunSummary} from "../../domain/recordedRunSummaryText";
import {recordedRunBadgeTone} from "../../domain/recordedRunBadge";
import {getActiveRunFilters} from "../../domain/activeRunFilters";
import {recordedStartDay,formatRecordedTime} from "../../domain/recordedTimestamp";
import {filterByAttentionReason,type AttentionReason,attentionReasons,summarizeAttentionReasons,listAttentionReasons} from "../../domain/attentionReasonSummary";
import {filterRunsRequiringAttention} from "../../domain/operationsAttention";
import {parseSharedRunFilters,serializeSharedRunFilters} from "../../domain/sharedRunFilters";
import {evidenceCategories,summarizeRecordedEvidence} from "../../domain/recordedEvidenceSummary";
import {recordedEvidence,filterByRecordedEvidence,type RecordedEvidence} from "../../domain/recordedEvidence";
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
  const day=recordedStartDay(run.startedAt);
  if(!day)return false;
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
 const [attentionReason,setAttentionReason]=useState<AttentionReason|null>(null);
 const [copiedRunId,setCopiedRunId]=useState<string|null>(null);
 const [copyError,setCopyError]=useState<string|null>(null);
 const [shareStatus,setShareStatus]=useState<string|null>(null);
 const [copiedSummaryId,setCopiedSummaryId]=useState<string|null>(null);
 const [summaryCopyErrorId,setSummaryCopyErrorId]=useState<string|null>(null);
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
  setAttentionReason(saved.attentionReason as AttentionReason|null);
  },0);
  return ()=>window.clearTimeout(timer);
 },[]);
 const shareFilters=async()=>{
  const queryString=serializeSharedRunFilters(window.location.search,{query,pipeline,state,sort,evidence,from,to,attention:attentionOnly,attentionReason});
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
 const copyRunSummary=async(run:AnalysisRun)=>{
  try{
   await navigator.clipboard.writeText(formatRecordedRunSummary(run));
   setCopiedSummaryId(run.id);setSummaryCopyErrorId(null);
  }catch{
   setCopiedSummaryId(null);setSummaryCopyErrorId(run.id);
  }
 };
 const activeFilters=getActiveRunFilters({query,pipeline,state,sort,evidence,from,to,attention:attentionOnly,attentionReason});
 const clearActiveFilter=(key:string)=>{
  switch(key){
   case "query":setQuery("");break;
   case "pipeline":setPipeline("all");break;
   case "state":setState("all");break;
   case "evidence":setEvidence("all");break;
   case "from":setFrom("");break;
   case "to":setTo("");break;
   case "attention":setAttentionOnly(false);break;
   case "attentionReason":setAttentionReason(null);break;
   case "sort":setSort("newest");break;
  }
 };
 const counts=summarizeReturnedRunStates(runs);
 const evidenceCounts=summarizeRecordedEvidence(runs);
 const attentionCounts=summarizeAttentionReasons(runs);
 const statusEvidence=summarizeStatusEvidenceMatrix(runs);
 const statusEvidenceTotals=statusEvidenceMatrixTotals(statusEvidence);
 const filterMatrixRow=(status:AnalysisRunState)=>{
  const selected=selectMatrixRow({state,evidence},status);
  setState(selected.state);setEvidence(selected.evidence);
 };
 const filterMatrixColumn=(item:RecordedEvidence)=>{
  const selected=selectMatrixColumn({state,evidence},item);
  setState(selected.state);setEvidence(selected.evidence);
 };
 const visible=sortRecordedRuns(filterByAttentionReason(filterRunsRequiringAttention(filterByRecordedEvidence(filterRunsByStartDate(filterRecordedRuns(runs,pipeline,state,query),from,to),evidence),attentionOnly),attentionReason),sort);
 const downloadCsv=()=>{
  const csv=exportRecordedRunsCsv(visible);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-recorded-runs.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const formatTime=(value:string|null)=>formatRecordedTime(value,locale);
 return <div className="recorded-run-explorer">
  <div className="recorded-run-summary" aria-label="Returned execution status summary">
   {recordedStates.map(item=><button type="button" key={item} aria-pressed={state===item} aria-label={`Filter ${item} recorded executions (${counts[item]})`} onClick={()=>setState(current=>current===item?"all":item)}><span>{item}</span><strong>{counts[item]}</strong></button>)}
  </div>
  <p className="metric-detail">Select a status count to filter the records below; select it again to clear that status. Status totals describe only the {runs.length} execution records returned by this API request, not the complete execution history. A recorded completed operation does not establish semantic approval.</p>
  <div className="recorded-run-summary" aria-label="Returned evidence status summary">
   {evidenceCategories.map(item=><button type="button" key={item} aria-pressed={evidence===item} aria-label={`Filter ${item} evidence records (${evidenceCounts[item]})`} onClick={()=>setEvidence(current=>current===item?"all":item)}><span>{item}</span><strong>{evidenceCounts[item]}</strong></button>)}
  </div>
  <p className="metric-detail">Evidence totals describe only the {runs.length} returned executions. Missing or malformed evidence labels are counted as not recorded, not validated. Select a count to filter; select again to clear.</p>
  <section className="recorded-run-matrix" aria-label="Recorded execution and evidence combinations">
   <h3>Execution × evidence breakdown</h3>
   <p className="metric-detail">Counts use only the {runs.length} records returned by the API. Select a cell to filter by both dimensions, or a row/column total to inspect all evidence or execution states in that margin. Select an active cell or total again to clear it. Other search, date and attention filters still apply to results, so the list may be smaller than these totals. Recorded execution outcomes do not grant semantic approval.</p>
   <div className="recorded-run-matrix-scroll">
    <table>
     <thead><tr><th scope="col">Execution</th>{evidenceCategories.map(item=><th scope="col" key={item}>{item.replaceAll("-"," ")}</th>)}<th scope="col">Row total</th></tr></thead>
     <tbody>{recordedStates.map(status=><tr key={status}>
      <th scope="row">{status}</th>
      {evidenceCategories.map(item=><td key={item}><button type="button" disabled={statusEvidence[status][item]===0} aria-pressed={state===status&&evidence===item} aria-label={`Filter ${status} execution and ${item} evidence (${statusEvidence[status][item]} records)`} onClick={()=>{if(state===status&&evidence===item){setState("all");setEvidence("all");}else{setState(status);setEvidence(item);}}}>{statusEvidence[status][item]}</button></td>)}
      <td className="recorded-run-matrix-total"><button type="button" disabled={statusEvidenceTotals.byState[status]===0} aria-pressed={state===status&&evidence==="all"} aria-label={`Filter all evidence for ${status} executions (${statusEvidenceTotals.byState[status]} records)`} onClick={()=>filterMatrixRow(status)}>{statusEvidenceTotals.byState[status]}</button></td>
     </tr>)}</tbody>
     <tfoot><tr><th scope="row">Column total</th>{evidenceCategories.map(item=><td className="recorded-run-matrix-total" key={item}><button type="button" disabled={statusEvidenceTotals.byEvidence[item]===0} aria-pressed={state==="all"&&evidence===item} aria-label={`Filter all executions with ${item} evidence (${statusEvidenceTotals.byEvidence[item]} records)`} onClick={()=>filterMatrixColumn(item)}>{statusEvidenceTotals.byEvidence[item]}</button></td>)}<td className="recorded-run-matrix-total" aria-label={"Total returned executions: "+statusEvidenceTotals.total}>{statusEvidenceTotals.total}</td></tr></tfoot>
    </table>
   </div>
  </section>
  <section aria-label="Reasons requiring attention">
   <h3>Recorded attention reasons</h3>
   <div className="recorded-run-summary">
    {attentionReasons.map(reason=><button type="button" key={reason} aria-pressed={attentionReason===reason} onClick={()=>setAttentionReason(current=>current===reason?null:reason)} aria-label={`Filter attention reason ${reason} (${attentionCounts[reason]})`}><span>{reason.replaceAll("-"," ")}</span><strong>{attentionCounts[reason]}</strong></button>)}
   </div>
   <p className="metric-detail">Select a reason to inspect matching records; select it again to clear. Counts cover only returned records. A single run may have multiple recorded reasons, so counts must not be added to estimate distinct affected executions.</p>
  </section>
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
   <button type="button" className="recorded-run-reset" onClick={()=>{setQuery("");setPipeline("all");setState("all");setSort("newest");setFrom("");setTo("");setEvidence("all");setAttentionOnly(false);setAttentionReason(null);}} disabled={!query&&!from&&!to&&pipeline==="all"&&state==="all"&&sort==="newest"&&evidence==="all"&&!attentionOnly&&attentionReason===null}>Reset filters</button>
  </div>
  <div className="recorded-run-active-filters" aria-label="Active execution filters">
   <strong>Active filters ({activeFilters.length})</strong>
   {activeFilters.length===0?<span className="metric-detail">None — default view</span>:activeFilters.map(item=><button type="button" key={item.key} onClick={()=>clearActiveFilter(item.key)} aria-label={"Remove "+item.label+" filter"}>{item.label}<span aria-hidden="true"> ×</span></button>)}
  </div>
  {shareStatus?<p role="status" className="metric-detail">{shareStatus}</p>:null}
  <p className="metric-detail" role="status">Showing {visible.length} of {runs.length} returned execution records. Needs attention includes recorded failures, blocked executions, invalid evidence or unavailable evidence; it does not imply a complete history. Evidence classifications are parsed only from explicitly recorded backend diagnostics; missing evidence is not treated as valid. Date filters use UTC dates of recorded start times. Records without start times are excluded when a date range is selected. Filters and CSV export apply only to returned records; the API may contain additional records beyond its first 25.</p>
  {visible.length===0?<p className="section-copy">No recorded executions match these filters.</p>:
   <div className="operations-runs">{visible.map(run=><article className="operations-run" key={run.id}>
    <div><strong>{run.pipeline}</strong><p className="metric-detail">{run.id} · {run.dataThrough??"—"}</p><button className="recorded-run-copy" type="button" onClick={()=>void copyRunId(run.id)} aria-label={"Copy run ID "+run.id}>Copy run ID</button>{copiedRunId===run.id?<span className="metric-detail" role="status">Copied</span>:null}{copyError===run.id?<span className="metric-detail" role="alert">Copy unavailable</span>:null}</div>
    <div><span className="status-pill" data-state={recordedRunBadgeTone(run.state)}>{run.state}</span><span className="recorded-run-evidence" aria-label={"Recorded evidence: "+recordedEvidence(run)}>Evidence: {recordedEvidence(run).replaceAll("-"," ")}</span><p className="metric-detail">{formatTime(run.startedAt)}</p>{listAttentionReasons(run).length>0?<div className="recorded-run-reason-tags" aria-label={"Recorded attention reasons for "+run.id}>{listAttentionReasons(run).map(reason=><span key={reason}>{reason.replaceAll("-"," ")}</span>)}</div>:null}</div>
    <details className="recorded-run-details"><summary>Inspect recorded details</summary>
      <button type="button" className="recorded-run-copy" onClick={()=>void copyRunSummary(run)} aria-label={"Copy recorded details for "+run.id}>Copy run details</button>{copiedSummaryId===run.id?<span role="status" className="metric-detail">Details copied</span>:null}{summaryCopyErrorId===run.id?<span role="alert" className="metric-detail">Copy unavailable</span>:null}
      <dl>
        <div><dt>Run ID</dt><dd>{run.id}</dd></div>
        <div><dt>Pipeline</dt><dd>{run.pipeline}</dd></div>
        <div><dt>Recorded status</dt><dd>{run.state}</dd></div>
        <div><dt>Recorded evidence status</dt><dd>{recordedEvidence(run).replaceAll("-"," ")}</dd></div>
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
