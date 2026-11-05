import type {AnalysisRun} from "./operations";
import {coveragePipelines,coveragePipelineOf,type CoveragePipeline} from "./pipelineEvidenceCoverage";
import {recordedEvidence} from "./recordedEvidence";

export interface PipelineMissingEvidenceTriage {
 pipeline:CoveragePipeline;
 missing:number;
 missingStartTimes:number;
 oldestStartedAt:string|null;
}

/** Observed timestamps only: no assumed SLA, backfilled start time, or approval. */
export function summarizePipelineMissingEvidenceTriage(runs:readonly AnalysisRun[]):PipelineMissingEvidenceTriage[]{
 const rows=coveragePipelines.map(pipeline=>({
  pipeline,missing:0,missingStartTimes:0,oldestStartedAt:null as string|null
 }));
 for(const run of runs){
  if(recordedEvidence(run)!=="not-recorded")continue;
  const row=rows.find(item=>item.pipeline===coveragePipelineOf(run.pipeline));
  if(!row)continue;
  row.missing++;
  const millis=run.startedAt?Date.parse(run.startedAt):NaN;
  if(!Number.isFinite(millis)){
   row.missingStartTimes++;
   continue;
  }
  const timestamp=new Date(millis).toISOString();
  if(row.oldestStartedAt===null||timestamp<row.oldestStartedAt)row.oldestStartedAt=timestamp;
 }
 return rows;
}
