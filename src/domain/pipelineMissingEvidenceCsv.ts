import type {AnalysisRun} from "./operations";
import type {CoveragePipeline} from "./pipelineEvidenceCoverage";
import {coveragePipelineOf} from "./pipelineEvidenceCoverage";
import {recordedEvidence} from "./recordedEvidence";
import {exportRecordedRunsCsv} from "./operationsCsv";

/** Export only API-returned runs without an explicitly recorded evidence classification. */
export function exportPipelineMissingEvidenceCsv(runs:readonly AnalysisRun[],pipeline:CoveragePipeline):string{
 return exportRecordedRunsCsv(runs.filter(run=>
  coveragePipelineOf(run.pipeline)===pipeline&&recordedEvidence(run)==="not-recorded"
 ));
}
