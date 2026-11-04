import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";

/** CSV values come solely from already summarized API-returned executions. */
export function exportPipelineEvidenceCoverageCsv(rows:readonly PipelineEvidenceCoverage[]):string{
 const values:(string|number)[][]=[
  ["Pipeline","Returned executions","Evidence recorded","Evidence not recorded","Evidence validated","Evidence recording rate"],
  ...rows.map(row=>[
   row.pipeline==="other"?"Other pipelines":row.pipeline,
   row.total,row.recorded,row.notRecorded,row.validated,
   row.recordedPercent===null?"":row.recordedPercent+"%"
  ])
 ];
 return "\uFEFF"+values.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(",")).join("\r\n")+"\r\n";
}
