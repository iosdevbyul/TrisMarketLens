import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import type {PipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";

/** Export returned-run summaries only. Missing timestamps and empty denominators stay blank. */
export function exportPipelineTriageCsv(
 coverage:readonly PipelineEvidenceCoverage[],
 triage:readonly PipelineMissingEvidenceTriage[]
):string{
 const byPipeline=new Map(triage.map(row=>[row.pipeline,row]));
 const header=[
  "Pipeline","Returned executions","Evidence recorded","Evidence not recorded",
  "Evidence validated","Evidence recording rate","Oldest missing-evidence start (UTC)",
  "Missing-evidence executions without usable start time"
 ];
 const rows=coverage.map(row=>{
  const detail=byPipeline.get(row.pipeline);
  if(!detail)throw new Error("Missing pipeline triage data: "+row.pipeline);
  return [
   row.pipeline==="other"?"Other pipelines":row.pipeline,
   row.total,row.recorded,row.notRecorded,row.validated,
   row.recordedPercent===null?"":row.recordedPercent+"%",
   detail.oldestStartedAt??"",detail.missingStartTimes
  ];
 });
 const cell=(value:string|number)=>'"'+String(value).replaceAll('"','""')+'"';
 return "\uFEFF"+[header,...rows].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
