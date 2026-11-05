import type {PipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import type {PipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";

/** Summarizes only the currently returned execution records, without inventing approval. */
export function formatPipelineTriageHandoff(
 coverage:PipelineEvidenceCoverage,triage:PipelineMissingEvidenceTriage,quality:PipelineEvidenceQuality
):string{
 if(coverage.pipeline!==triage.pipeline||coverage.pipeline!==quality.pipeline)throw new Error("Mismatched pipeline summaries");
 if(quality.total!==coverage.total||quality.validated!==coverage.validated||quality["not-recorded"]!==coverage.notRecorded||quality.validated+quality.partial+quality.invalid+quality.unavailable!==coverage.recorded)throw new Error("Inconsistent evidence classification counts");
 const pipeline=coverage.pipeline==="other"?"Other pipelines":coverage.pipeline;
 return [
  "Operations evidence recording — pipeline handoff",
  "Pipeline: "+pipeline,
  "Scope: API-returned executions only; not a complete execution history.",
  "Returned executions: "+coverage.total,
  "Evidence recorded: "+coverage.recorded,
  "Evidence not recorded: "+coverage.notRecorded,
  "Evidence validated (explicitly recorded): "+coverage.validated,
  "Evidence partial (explicitly recorded): "+quality.partial,
  "Evidence invalid (explicitly recorded): "+quality.invalid,
  "Evidence unavailable (explicitly recorded): "+quality.unavailable,
  "Evidence recording rate: "+(coverage.recordedPercent===null?"Unavailable (no returned executions)":coverage.recordedPercent+"%"),
  "Oldest missing-evidence start (UTC): "+(triage.oldestStartedAt??"Unavailable"),
  "Missing-evidence executions without a usable start time: "+triage.missingStartTimes,
  "Note: Recorded evidence is not approval; missing timestamps are not inferred."
 ].join("\n");
}
