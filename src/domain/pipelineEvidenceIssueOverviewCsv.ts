import type {PipelineEvidenceIssueOverview} from "./pipelineEvidenceIssueOverview";
import {formatPipelineEvidenceIssueOverviewHandoff} from "./pipelineEvidenceIssueOverviewHandoff";

/** CSV is limited to API-returned executions, never a complete historical incident report. */
export function exportPipelineEvidenceIssueOverviewCsv(
 overview:PipelineEvidenceIssueOverview,returnedExecutions:number
):string{
 // Reuse the existing overview contract to reject inconsistent totals and timestamps.
 formatPipelineEvidenceIssueOverviewHandoff(overview,returnedExecutions);
 const percent=returnedExecutions===0?"":Math.round(overview.total/returnedExecutions*100)+"%";
 const headers=["Returned executions","Explicitly invalid","Explicitly unavailable","Total explicit issues","Explicit issue share","Oldest observed issue execution start (UTC)","Issue start times unavailable"];
 const values=[returnedExecutions,overview.invalid,overview.unavailable,overview.total,percent,overview.oldestStartedAt??"",overview.missingStartTimes];
 const cell=(value:string|number)=>{
  const raw=String(value);
  const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
 };
 return "\uFEFF"+[headers,values].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
