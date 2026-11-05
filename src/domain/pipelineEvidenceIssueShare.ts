import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";

/** Share of returned executions explicitly labeled invalid or unavailable; not an incident rate. */
export function summarizePipelineEvidenceIssueShare(
 rows:readonly PipelineEvidenceQuality[]
):{issues:number;returned:number;percent:number|null}{
 let issues=0,returned=0;
 for(const row of rows){
  const counts=[row.validated,row.partial,row.invalid,row.unavailable,row["not-recorded"]];
  if(!Number.isSafeInteger(row.total)||row.total<0||
     counts.some(value=>!Number.isSafeInteger(value)||value<0)||
     counts.reduce((sum,value)=>sum+value,0)!==row.total)
   throw new Error("Inconsistent pipeline evidence issue share");
  returned+=row.total;
  issues+=row.invalid+row.unavailable;
 }
 return {issues,returned,percent:returned===0?null:Math.round(issues/returned*100)};
}
