import type {PipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";

/** Read-only operator handoff for explicitly invalid/unavailable API-returned executions. */
export function formatPipelineEvidenceIssueHandoff(
 quality:PipelineEvidenceQuality,age:PipelineEvidenceIssueAge
):string{
 if(quality.pipeline!==age.pipeline)throw new Error("Mismatched pipeline issue summaries");
 if(quality.invalid+quality.unavailable!==age.issues)throw new Error("Inconsistent evidence issue counts");
 if(age.missingStartTimes>age.issues||age.missingStartTimes<0)throw new Error("Inconsistent issue timestamp counts");
 const label=quality.pipeline==="other"?"Other pipelines":quality.pipeline;
 return [
  "Operations evidence issues — pipeline handoff",
  "Pipeline: "+label,
  "Scope: API-returned executions only; not a complete execution history.",
  "Evidence invalid (explicitly recorded): "+quality.invalid,
  "Evidence unavailable (explicitly recorded): "+quality.unavailable,
  "Total explicit evidence issues: "+age.issues,
  "Oldest issue execution start (UTC): "+(age.oldestStartedAt??"Unavailable"),
  "Issue executions without a usable start time: "+age.missingStartTimes,
  "Note: The start is an execution timestamp, not the time an issue was discovered. No incident age, SLA, verification or approval is inferred."
 ].join("\n");
}
