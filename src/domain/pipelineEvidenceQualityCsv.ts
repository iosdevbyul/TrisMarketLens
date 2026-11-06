import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueShare} from "./pipelineEvidenceIssueShare";

/** Export explicit evidence classifications from the API-returned execution window only. */
export function exportPipelineEvidenceQualityCsv(rows:readonly PipelineEvidenceQuality[]):string{
 const values:(string|number)[][]=[
  ["Pipeline","Returned executions","Validated","Partial","Invalid","Unavailable","Not recorded","Explicit issue share"],
  ...rows.map(row=>{
   const issueShare=summarizePipelineEvidenceIssueShare([row]);
   return [
    row.pipeline==="other"?"Other pipelines":row.pipeline,
    row.total,row.validated,row.partial,row.invalid,row.unavailable,row["not-recorded"],
    issueShare.percent===null?"":issueShare.percent+"%"
   ];
  })
 ];
 // Quoting every cell and escaping potential spreadsheet formulas preserves untrusted pipeline text.
 const cell=(value:string|number)=>{
  const raw=String(value);
  const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
 };
 return "\uFEFF"+values.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
