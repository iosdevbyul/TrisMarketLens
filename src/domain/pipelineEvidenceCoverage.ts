import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";

export const coveragePipelines=["Market collection","DART session","DART batch acquisition","other"] as const;
export type CoveragePipeline=(typeof coveragePipelines)[number];
export interface PipelineEvidenceCoverage {
 pipeline:CoveragePipeline;
 total:number;
 recorded:number;
 notRecorded:number;
 validated:number;
 recordedPercent:number|null;
}
export function coveragePipelineOf(pipeline:string):CoveragePipeline{
 return coveragePipelines.slice(0,3).some(name=>name===pipeline)
  ?pipeline as CoveragePipeline:"other";
}
/** Evidence recorded means a classification exists, not that validation succeeded. */
export function summarizePipelineEvidenceCoverage(runs:readonly AnalysisRun[]):PipelineEvidenceCoverage[]{
 const rows=coveragePipelines.map(pipeline=>({pipeline,total:0,recorded:0,notRecorded:0,validated:0,recordedPercent:null as number|null}));
 for(const run of runs){
  const row=rows.find(item=>item.pipeline===coveragePipelineOf(run.pipeline));
  if(!row)continue;
  row.total++;
  const evidence=recordedEvidence(run);
  if(evidence==="not-recorded")row.notRecorded++;
  else row.recorded++;
  if(evidence==="validated")row.validated++;
 }
 for(const row of rows)row.recordedPercent=row.total===0?null:Math.round(row.recorded/row.total*100);
 return rows;
}
