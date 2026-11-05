import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import type {PipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";

export interface PipelineEvidenceIssueOverview {
 invalid:number;
 unavailable:number;
 total:number;
 missingStartTimes:number;
 oldestStartedAt:string|null;
}

/** Aggregate observed evidence issues only; no inferred incident timestamp or SLA. */
export function summarizePipelineEvidenceIssueOverview(
 quality:readonly PipelineEvidenceQuality[],
 ages:readonly PipelineEvidenceIssueAge[]
):PipelineEvidenceIssueOverview{
 const byPipeline=new Map(ages.map(age=>[age.pipeline,age]));
 if(byPipeline.size!==ages.length||quality.length!==ages.length)
  throw new Error("Mismatched pipeline issue overview rows");
 let invalid=0,unavailable=0,missingStartTimes=0;
 let oldestStartedAt:string|null=null;
 for(const row of quality){
  const age=byPipeline.get(row.pipeline);
  if(!age||row.invalid+row.unavailable!==age.issues||age.missingStartTimes<0||
     age.missingStartTimes>age.issues||(age.issues>age.missingStartTimes)===(age.oldestStartedAt===null))
   throw new Error("Inconsistent pipeline issue overview");
  invalid+=row.invalid;
  unavailable+=row.unavailable;
  missingStartTimes+=age.missingStartTimes;
  if(age.oldestStartedAt!==null&&(oldestStartedAt===null||age.oldestStartedAt<oldestStartedAt))
   oldestStartedAt=age.oldestStartedAt;
 }
 return {invalid,unavailable,total:invalid+unavailable,missingStartTimes,oldestStartedAt};
}
