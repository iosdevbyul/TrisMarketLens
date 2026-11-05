import type {AnalysisRun} from "./operations";
import {coveragePipelines,coveragePipelineOf,type CoveragePipeline} from "./pipelineEvidenceCoverage";
import {recordedEvidence} from "./recordedEvidence";

export interface PipelineEvidenceIssueAge {
 pipeline:CoveragePipeline;
 issues:number;
 missingStartTimes:number;
 oldestStartedAt:string|null;
}

/** Observed invalid/unavailable evidence only; no invented incident start or SLA. */
export function summarizePipelineEvidenceIssueAge(runs:readonly AnalysisRun[]):PipelineEvidenceIssueAge[]{
 const rows:PipelineEvidenceIssueAge[]=coveragePipelines.map(pipeline=>({
  pipeline,issues:0,missingStartTimes:0,oldestStartedAt:null
 }));
 const byPipeline=new Map(rows.map(row=>[row.pipeline,row]));
 for(const run of runs){
  const evidence=recordedEvidence(run);
  if(evidence!=="invalid"&&evidence!=="unavailable")continue;
  const row=byPipeline.get(coveragePipelineOf(run.pipeline));
  if(!row)continue;
  row.issues++;
  const milliseconds=run.startedAt?Date.parse(run.startedAt):NaN;
  if(!Number.isFinite(milliseconds)){
   row.missingStartTimes++;
   continue;
  }
  const timestamp=new Date(milliseconds).toISOString();
  if(row.oldestStartedAt===null||timestamp<row.oldestStartedAt)row.oldestStartedAt=timestamp;
 }
 return rows;
}
