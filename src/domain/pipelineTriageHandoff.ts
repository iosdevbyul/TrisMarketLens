import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import type {PipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";

/** Summarizes only the currently returned execution records, without inventing approval. */
export function formatPipelineTriageHandoff(
 coverage:PipelineEvidenceCoverage,triage:PipelineMissingEvidenceTriage
):string{
 if(coverage.pipeline!==triage.pipeline)throw new Error("Mismatched pipeline summaries");
 const pipeline=coverage.pipeline==="other"?"Other pipelines":coverage.pipeline;
 return [
  "Operations evidence recording — pipeline handoff",
  "Pipeline: "+pipeline,
  "Scope: API-returned executions only; not a complete execution history.",
  "Returned executions: "+coverage.total,
  "Evidence recorded: "+coverage.recorded,
  "Evidence not recorded: "+coverage.notRecorded,
  "Evidence validated (explicitly recorded): "+coverage.validated,
  "Evidence recording rate: "+(coverage.recordedPercent===null?"Unavailable (no returned executions)":coverage.recordedPercent+"%"),
  "Oldest missing-evidence start (UTC): "+(triage.oldestStartedAt??"Unavailable"),
  "Missing-evidence executions without a usable start time: "+triage.missingStartTimes,
  "Note: Recorded evidence is not approval; missing timestamps are not inferred."
 ].join("\n");
}
