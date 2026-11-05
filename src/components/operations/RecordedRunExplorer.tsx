"use client";
import {useEffect,useState} from "react";
import {exportPipelineEvidenceCoverageCsv} from "../../domain/pipelineEvidenceCoverageCsv";
import {exportPipelineTriageCsv} from "../../domain/pipelineTriageCsv";
import {exportPipelineMissingEvidenceCsv} from "../../domain/pipelineMissingEvidenceCsv";
import {exportPipelineEvidenceIssuesCsv} from "../../domain/pipelineEvidenceIssuesCsv";
import {summarizePipelineMissingEvidenceTriage} from "../../domain/pipelineMissingEvidenceTriage";
import {summarizePipelineEvidenceIssueAge} from "../../domain/pipelineEvidenceIssueAge";
import {summarizePipelineEvidenceQuality} from "../../domain/pipelineEvidenceQuality";
import {exportPipelineEvidenceQualityCsv} from "../../domain/pipelineEvidenceQualityCsv";
import {selectPipelineEvidence} from "../../domain/pipelineEvidenceSelection";
import {orderPipelineCoverage,type PipelineCoverageOrder} from "../../domain/pipelineCoverageOrdering";
import {formatPipelineTriageHandoff} from "../../domain/pipelineTriageHandoff";
import {selectOldestMissingEvidenceReview} from "../../domain/oldestMissingEvidenceReview";
import {selectPipelineQualityReview,type ReviewableEvidence} from "../../domain/pipelineQualityReview";
import type {CoveragePipeline} from "../../domain/pipelineEvidenceCoverage";
import {selectMissingPipelineEvidence} from "../../domain/pipelineMissingEvidenceSelection";
import {summarizePipelineEvidenceCoverage} from "../../domain/pipelineEvidenceCoverage";
import {summarizeEvidenceRecording} from "../../domain/evidenceRecordingCoverage";
import {exportStatusEvidenceMatrixCsv} from "../../domain/statusEvidenceMatrixCsv";
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
 const [handoffCopyStatus,setHandoffCopyStatus]=useState<string|null>(null);
 const [coverageOrder,setCoverageOrder]=useState<PipelineCoverageOrder>("default");
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
 const evidenceCoverage=summarizeEvidenceRecording(statusEvidence);
 const pipelineEvidenceCoverage=summarizePipelineEvidenceCoverage(runs);
 const pipelineEvidenceQuality=summarizePipelineEvidenceQuality(runs);
 const missingEvidenceTriage=summarizePipelineMissingEvidenceTriage(runs);
 const evidenceIssueAges=summarizePipelineEvidenceIssueAge(runs);
 const orderedPipelineCoverage=orderPipelineCoverage(pipelineEvidenceCoverage,missingEvidenceTriage,coverageOrder);
 const copyPipelineHandoff=async(selectedPipeline:CoveragePipeline)=>{
  const coverage=pipelineEvidenceCoverage.find(item=>item.pipeline===selectedPipeline);
  const triage=missingEvidenceTriage.find(item=>item.pipeline===selectedPipeline);
  const quality=pipelineEvidenceQuality.find(item=>item.pipeline===selectedPipeline);
  if(!coverage||!triage||!quality)return;
  try{
   await navigator.clipboard.writeText(formatPipelineTriageHandoff(coverage,triage,quality));
   setHandoffCopyStatus(selectedPipeline+" handoff copied");
  }catch{
   setHandoffCopyStatus(selectedPipeline+" handoff copy unavailable");
  }
 };
 const reviewOldestMissingEvidence=(selectedPipeline:CoveragePipeline)=>{
  const selected=selectOldestMissingEvidenceReview(
   {query,pipeline,state,evidence,sort,from,to,attention:attentionOnly,attentionReason},
   selectedPipeline
  );
  setQuery(selected.query);
  setPipeline(selected.pipeline as RunFilter);
  setState(selected.state as AnalysisRunState|"all");
  setEvidence(selected.evidence as RecordedEvidence|"all");
  setSort(selected.sort as RunSort);
  setFrom(selected.from);setTo(selected.to);
  setAttentionOnly(selected.attention);
  setAttentionReason(selected.attentionReason as AttentionReason|null);
 };
 const reviewPipelineQuality=(selectedPipeline:CoveragePipeline,selectedEvidence:ReviewableEvidence)=>{
  const selected=selectPipelineQualityReview(
   {query,pipeline,state,evidence,sort,from,to,attention:attentionOnly,attentionReason},
   selectedPipeline,selectedEvidence
  );
  setQuery(selected.query);
  setPipeline(selected.pipeline as RunFilter);
  setState(selected.state as AnalysisRunState|"all");
  setEvidence(selected.evidence as RecordedEvidence|"all");
  setSort(selected.sort as RunSort);
  setFrom(selected.from);setTo(selected.to);
  setAttentionOnly(selected.attention);
  setAttentionReason(selected.attentionReason as AttentionReason|null);
 };
 const filterPipelineQuality=(selectedPipeline:CoveragePipeline,selectedEvidence:RecordedEvidence)=>{
  const selected=selectPipelineEvidence({pipeline,evidence},selectedPipeline,selectedEvidence);
  setPipeline(selected.pipeline);
  setEvidence(selected.evidence);
 };
 const filterPipelineMissingEvidence=(selectedPipeline:Exclude<RunFilter,"all">)=>{
  const selected=selectMissingPipelineEvidence({pipeline,evidence},selectedPipeline);
  setPipeline(selected.pipeline);setEvidence(selected.evidence);
 };
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
 const downloadPipelineEvidenceIssuesCsv=(selectedPipeline:CoveragePipeline)=>{
  const csv=exportPipelineEvidenceIssuesCsv(runs,selectedPipeline);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="operations-"+selectedPipeline.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-evidence-issues.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const downloadPipelineMissingEvidenceCsv=(selectedPipeline:CoveragePipeline)=>{
  const csv=exportPipelineMissingEvidenceCsv(runs,selectedPipeline);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="operations-"+selectedPipeline.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-missing-evidence.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const downloadPipelineQualityCsv=()=>{
  const qualityByPipeline=new Map(pipelineEvidenceQuality.map(row=>[row.pipeline,row]));
  const rows=orderedPipelineCoverage.map(row=>qualityByPipeline.get(row.pipeline)).filter(
   (row):row is (typeof pipelineEvidenceQuality)[number]=>row!==undefined
  );
  const csv=exportPipelineEvidenceQualityCsv(rows);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-pipeline-evidence-quality.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const downloadPipelineTriageCsv=()=>{
  const csv=exportPipelineTriageCsv(orderedPipelineCoverage,missingEvidenceTriage);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-pipeline-evidence-triage.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const downloadPipelineCoverageCsv=()=>{
  const blob=new Blob([exportPipelineEvidenceCoverageCsv(pipelineEvidenceCoverage)],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-pipeline-evidence-coverage.csv";
  document.body.appendChild(link);link.click();link.remove();
  URL.revokeObjectURL(url);
 };
 const downloadMatrixCsv=()=>{
  const blob=new Blob([exportStatusEvidenceMatrixCsv(statusEvidence)],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="operations-status-evidence-matrix.csv";
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
   <div className="recorded-run-coverage" aria-label="Evidence recording coverage of returned executions">
    <div><span>Evidence status recorded</span><strong>{evidenceCoverage.recordedPercent}%</strong><small>{evidenceCoverage.recorded} of {evidenceCoverage.total} returned runs</small></div>
    <div><span>Evidence not recorded</span><strong>{evidenceCoverage.notRecordedPercent}%</strong><small>{evidenceCoverage.notRecorded} of {evidenceCoverage.total} returned runs</small></div>
    <div><span>Evidence validated</span><strong>{evidenceCoverage.validated}</strong><small>Explicitly labeled validated; not inferred from successful runs</small></div>
   </div>
   <p className="metric-detail">Evidence recorded includes validated, partial, invalid and unavailable classifications. It measures recording coverage, not the proportion of evidence approved. Percentages use only API-returned executions; 0 returned runs display 0% rather than an inferred rate.</p>
   <section aria-label="Evidence recording coverage by pipeline" className="recorded-run-pipeline-coverage">
    <h4>Evidence recording by pipeline</h4>
    <label>Pipeline row order <select aria-label="Pipeline row order" value={coverageOrder} onChange={event=>setCoverageOrder(event.target.value as PipelineCoverageOrder)}><option value="default">Default</option><option value="most-missing-first">Most missing evidence first</option><option value="oldest-missing-first">Oldest missing evidence first</option></select></label>
    <button type="button" className="recorded-run-reset" onClick={downloadPipelineCoverageCsv}>Export pipeline coverage CSV</button>
    <button type="button" className="recorded-run-reset" onClick={downloadPipelineTriageCsv}>Export triage CSV</button>
    <button type="button" className="recorded-run-reset" onClick={downloadPipelineQualityCsv}>Export evidence quality CSV</button>
    <p className="metric-detail">Each row covers only records returned by the API. Other groups unrecognized pipeline names. A dash means no executions were returned for that pipeline; recorded evidence does not imply validation. Select a nonzero Not recorded count to filter by its pipeline and missing evidence; select it again to clear both dimensions. Export missing CSV downloads only that pipeline&apos;s returned records without an explicit evidence classification, independent of active filters. Oldest start is the earliest valid recorded UTC start among missing-evidence executions; missing start counts have no usable timestamp. Copy handoff includes returned-run coverage, explicit evidence quality categories, and timestamps, not a verification decision. Row ordering changes the table display; existing exports keep their original order, while triage and evidence quality CSV follow the selected table order. Missing timestamps appear after known timestamps. Issue start columns include only explicitly invalid or unavailable evidence and show the oldest observed UTC start and the number of unusable starts; they do not establish incident age or an SLA. Review oldest resets other filters to show that pipeline&apos;s returned missing-evidence executions in ascending start order (unknown times last). Export issues CSV downloads only the selected pipeline&apos;s explicitly invalid or unavailable executions, oldest first with unknown starts last and independently of active filters. Partial, invalid, and unavailable counts use only explicit backend evidence labels and can be selected to filter the returned runs; other active filters still apply to count drilldowns. Review invalid and Review unavailable reset unrelated filters and sort the selected evidence class oldest first; records without valid start timestamps remain last.</p>
    <div className="recorded-run-matrix-scroll">
     <table>
      <thead><tr><th scope="col">Pipeline</th><th scope="col">Returned</th><th scope="col">Recorded</th><th scope="col">Not recorded</th><th scope="col">Validated</th><th scope="col">Partial</th><th scope="col">Invalid</th><th scope="col">Unavailable</th><th scope="col">Recording rate</th><th scope="col">Oldest missing start (UTC)</th><th scope="col">Missing start times</th><th scope="col">Oldest issue start (UTC)</th><th scope="col">Issue start times missing</th><th scope="col">Review missing records</th><th scope="col">Review evidence issues</th><th scope="col">Copy handoff</th><th scope="col">Evidence issues export</th><th scope="col">Missing evidence export</th></tr></thead>
      <tbody>{orderedPipelineCoverage.map(row=><tr key={row.pipeline}>
       <th scope="row">{row.pipeline==="other"?"Other pipelines":row.pipeline}</th>
       <td>{row.total}</td><td>{row.recorded}</td><td><button type="button" className="recorded-run-pipeline-drilldown" disabled={row.notRecorded===0} aria-pressed={pipeline===row.pipeline&&evidence==="not-recorded"} aria-label={`Filter ${row.pipeline} executions with no recorded evidence (${row.notRecorded} records)`} onClick={()=>filterPipelineMissingEvidence(row.pipeline)}>{row.notRecorded}</button></td><td>{row.validated}</td>{(["partial","invalid","unavailable"] as const).map(item=>{
        const count=pipelineEvidenceQuality.find(quality=>quality.pipeline===row.pipeline)?.[item]??0;
        return <td key={item}><button type="button" className="recorded-run-pipeline-drilldown" disabled={count===0} aria-pressed={pipeline===row.pipeline&&evidence===item} aria-label={`Filter ${row.pipeline} executions with ${item} evidence (${count} records)`} onClick={()=>filterPipelineQuality(row.pipeline,item)}>{count}</button></td>;
       })}<td>{row.recordedPercent===null?"—":row.recordedPercent+"%"}</td><td>{missingEvidenceTriage.find(item=>item.pipeline===row.pipeline)?.oldestStartedAt?.replace("T"," ").replace(".000Z"," UTC")??"—"}</td><td>{missingEvidenceTriage.find(item=>item.pipeline===row.pipeline)?.missingStartTimes??0}</td><td>{evidenceIssueAges.find(item=>item.pipeline===row.pipeline)?.oldestStartedAt?.replace("T"," ").replace(".000Z"," UTC")??"—"}</td><td>{evidenceIssueAges.find(item=>item.pipeline===row.pipeline)?.missingStartTimes??0}</td><td><button type="button" className="recorded-run-reset" disabled={row.notRecorded===0} aria-label={`Review oldest missing evidence for ${row.pipeline} (${row.notRecorded} records)`} onClick={()=>reviewOldestMissingEvidence(row.pipeline)}>Review oldest</button></td><td>{(["invalid","unavailable"] as const).map(item=>{
        const count=pipelineEvidenceQuality.find(quality=>quality.pipeline===row.pipeline)?.[item]??0;
        return <button type="button" key={item} className="recorded-run-reset" disabled={count===0} aria-label={`Review ${item} evidence for ${row.pipeline} (${count} records), oldest first`} onClick={()=>reviewPipelineQuality(row.pipeline,item)}>Review {item} ({count})</button>;
       })}</td><td><button type="button" className="recorded-run-reset" disabled={row.total===0} aria-label={`Copy evidence triage handoff for ${row.pipeline}`} onClick={()=>void copyPipelineHandoff(row.pipeline)}>Copy handoff</button></td><td><button type="button" className="recorded-run-reset" disabled={(pipelineEvidenceQuality.find(quality=>quality.pipeline===row.pipeline)?.invalid??0)+(pipelineEvidenceQuality.find(quality=>quality.pipeline===row.pipeline)?.unavailable??0)===0} aria-label={`Export invalid and unavailable evidence CSV for ${row.pipeline}`} onClick={()=>downloadPipelineEvidenceIssuesCsv(row.pipeline)}>Export issues CSV</button></td><td><button type="button" className="recorded-run-reset" disabled={row.notRecorded===0} aria-label={`Export missing evidence CSV for ${row.pipeline} (${row.notRecorded} records)`} onClick={()=>downloadPipelineMissingEvidenceCsv(row.pipeline)}>Export missing CSV</button></td>
      </tr>)}</tbody>
     </table>
    </div>
    {handoffCopyStatus?<p className="metric-detail" role="status">{handoffCopyStatus}</p>:null}
   </section>
   <button type="button" className="recorded-run-reset" onClick={downloadMatrixCsv}>Export matrix CSV</button>
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
