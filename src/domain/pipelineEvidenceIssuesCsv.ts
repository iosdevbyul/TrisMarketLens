import type {AnalysisRun} from "./operations";
import {coveragePipelineOf,type CoveragePipeline} from "./pipelineEvidenceCoverage";
import {recordedEvidence} from "./recordedEvidence";
import {exportRecordedRunsCsv} from "./operationsCsv";

/** Export only explicit invalid/unavailable evidence, oldest first with unknown starts last. */
export function selectPipelineEvidenceIssues(
 runs:readonly AnalysisRun[],pipeline:CoveragePipeline
):AnalysisRun[]{
 return runs.filter(run=>{
  const category=recordedEvidence(run);
  return coveragePipelineOf(run.pipeline)===pipeline&&(category==="invalid"||category==="unavailable");
 }).sort((a,b)=>{
  const at=a.startedAt?Date.parse(a.startedAt):NaN;
  const bt=b.startedAt?Date.parse(b.startedAt):NaN;
  if(!Number.isFinite(at))return Number.isFinite(bt)?1:0;
  if(!Number.isFinite(bt))return -1;
  return at-bt;
 });
}

export function exportPipelineEvidenceIssuesCsv(
 runs:readonly AnalysisRun[],pipeline:CoveragePipeline
):string{
 return exportRecordedRunsCsv(selectPipelineEvidenceIssues(runs,pipeline));
}
