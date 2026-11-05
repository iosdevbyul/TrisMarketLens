import type {PipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";

/** Observed issue starts and explicit labels for API-returned executions only. */
export function exportPipelineEvidenceIssueAgeCsv(
 quality:readonly PipelineEvidenceQuality[],
 ages:readonly PipelineEvidenceIssueAge[]
):string{
 const byPipeline=new Map(ages.map(row=>[row.pipeline,row]));
 const rows:(string|number)[][]=[[
  "Pipeline","Invalid","Unavailable","Total explicit issues",
  "Oldest issue execution start (UTC)","Issues without usable start time"
 ]];
 for(const row of quality){
  const age=byPipeline.get(row.pipeline);
  if(!age)throw new Error("Missing pipeline issue age: "+row.pipeline);
  if(row.invalid+row.unavailable!==age.issues||
     age.missingStartTimes<0||age.missingStartTimes>age.issues)
   throw new Error("Inconsistent pipeline issue age: "+row.pipeline);
  rows.push([
   row.pipeline==="other"?"Other pipelines":row.pipeline,
   row.invalid,row.unavailable,age.issues,age.oldestStartedAt??"",age.missingStartTimes
  ]);
 }
 const cell=(value:string|number)=>{
  const raw=String(value);
  const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
 };
 return "\uFEFF"+rows.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
