import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import type {PipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
import type {PipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";

export type PipelineCoverageOrder="default"|"most-missing-first"|"oldest-missing-first"|"most-issues-first"|"oldest-issues-first";

/** Reorder existing API-returned coverage only; never invent a risk or approval ranking. */
export function orderPipelineCoverage(
 coverage:readonly PipelineEvidenceCoverage[],
 triage:readonly PipelineMissingEvidenceTriage[],
 order:PipelineCoverageOrder,
 issueAges:readonly PipelineEvidenceIssueAge[]=[]
):PipelineEvidenceCoverage[]{
 const rows=[...coverage];
 if(order==="default")return rows;
 const indexed=new Map(coverage.map((row,index)=>[row.pipeline,index]));
 const summaries=new Map(triage.map(row=>[row.pipeline,row]));
 const issues=new Map(issueAges.map(row=>[row.pipeline,row]));
 return rows.sort((a,b)=>{
  if(order==="most-missing-first"){
   const difference=b.notRecorded-a.notRecorded;
   return difference||((indexed.get(a.pipeline)??0)-(indexed.get(b.pipeline)??0));
  }
  if(order==="most-issues-first"){
   const difference=(issues.get(b.pipeline)?.issues??0)-(issues.get(a.pipeline)?.issues??0);
   return difference||((indexed.get(a.pipeline)??0)-(indexed.get(b.pipeline)??0));
  }
  const source=order==="oldest-issues-first"?issues:summaries;
  const first=source.get(a.pipeline)?.oldestStartedAt??null;
  const second=source.get(b.pipeline)?.oldestStartedAt??null;
  if(first===null&&second!==null)return 1;
  if(second===null&&first!==null)return -1;
  if(first!==null&&second!==null&&first!==second)return first<second?-1:1;
  return (indexed.get(a.pipeline)??0)-(indexed.get(b.pipeline)??0);
 });
}
