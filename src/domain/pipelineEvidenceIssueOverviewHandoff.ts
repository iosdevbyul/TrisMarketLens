import type {PipelineEvidenceIssueOverview} from "./pipelineEvidenceIssueOverview";

/** Share only observed, API-returned evidence issue totals, not an incident verdict. */
export function formatPipelineEvidenceIssueOverviewHandoff(
 overview:PipelineEvidenceIssueOverview,returnedExecutions:number
):string{
 if(!Number.isSafeInteger(returnedExecutions)||returnedExecutions<0||
    ![overview.invalid,overview.unavailable,overview.total,overview.missingStartTimes].every(
     value=>Number.isSafeInteger(value)&&value>=0
    )||
    overview.invalid+overview.unavailable!==overview.total||
    overview.total>returnedExecutions||overview.missingStartTimes>overview.total||
    (overview.total>overview.missingStartTimes)===(overview.oldestStartedAt===null))
  throw new Error("Inconsistent evidence issue overview handoff");
 return [
  "Operations evidence issues — overview handoff",
  "Scope: "+returnedExecutions+" API-returned executions only; not a complete execution history.",
  "Evidence invalid (explicitly recorded): "+overview.invalid,
  "Evidence unavailable (explicitly recorded): "+overview.unavailable,
  "Total explicit evidence issues: "+overview.total,
  "Explicit issue share of API-returned executions: "+(returnedExecutions===0?"Unavailable":Math.round(overview.total/returnedExecutions*100)+"%")+" ("+overview.total+" / "+returnedExecutions+")",
  "Oldest issue execution start (UTC): "+(overview.oldestStartedAt??"Unavailable"),
  "Issue executions without a usable start time: "+overview.missingStartTimes,
  "Note: The issue share is not incident frequency, failure rate or whole-history coverage. The oldest start is not incident discovery. No severity, SLA, validation or approval is inferred."
 ].join("\n");
}
