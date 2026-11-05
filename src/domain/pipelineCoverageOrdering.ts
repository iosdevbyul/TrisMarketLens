import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import type {PipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";

export type PipelineCoverageOrder="default"|"most-missing-first"|"oldest-missing-first";

/** Reorder existing API-returned coverage only; never invent a risk or approval ranking. */
export function orderPipelineCoverage(
 coverage:readonly PipelineEvidenceCoverage[],
 triage:readonly PipelineMissingEvidenceTriage[],
 order:PipelineCoverageOrder
):PipelineEvidenceCoverage[]{
 const rows=[...coverage];
 if(order==="default")return rows;
 const indexed=new Map(coverage.map((row,index)=>[row.pipeline,index]));
 const summaries=new Map(triage.map(row=>[row.pipeline,row]));
 return rows.sort((a,b)=>{
  if(order==="most-missing-first"){
   const difference=b.notRecorded-a.notRecorded;
   return difference||((indexed.get(a.pipeline)??0)-(indexed.get(b.pipeline)??0));
  }
  const first=summaries.get(a.pipeline)?.oldestStartedAt??null;
  const second=summaries.get(b.pipeline)?.oldestStartedAt??null;
  if(first===null&&second!==null)return 1;
  if(second===null&&first!==null)return -1;
  if(first!==null&&second!==null&&first!==second)return first<second?-1:1;
  return (indexed.get(a.pipeline)??0)-(indexed.get(b.pipeline)??0);
 });
}
