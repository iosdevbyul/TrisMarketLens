import type {AnalysisRun} from "./operations";
import {coveragePipelines,coveragePipelineOf,type CoveragePipeline} from "./pipelineEvidenceCoverage";
import {recordedEvidence,type RecordedEvidence} from "./recordedEvidence";

export type PipelineEvidenceQuality=Record<RecordedEvidence,number>&{pipeline:CoveragePipeline;total:number};

/** Count only explicitly recorded evidence labels from API-returned runs. */
export function summarizePipelineEvidenceQuality(runs:readonly AnalysisRun[]):PipelineEvidenceQuality[]{
 const rows=coveragePipelines.map(pipeline=>({
  pipeline,total:0,validated:0,partial:0,invalid:0,unavailable:0,"not-recorded":0
 }));
 const byPipeline=new Map<CoveragePipeline,PipelineEvidenceQuality>(rows.map(row=>[row.pipeline,row]));
 for(const run of runs){
  const row=byPipeline.get(coveragePipelineOf(run.pipeline));
  if(!row)continue;
  row.total++;
  row[recordedEvidence(run)]++;
 }
 return rows;
}
