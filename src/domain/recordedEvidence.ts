import type {AnalysisRun} from "./operations";
export type RecordedEvidence="validated"|"partial"|"invalid"|"unavailable"|"not-recorded";
export function recordedEvidence(run:Pick<AnalysisRun,"summary">):RecordedEvidence{
 const summary=run.summary??"";
 const match=/(?:^|\s[·]\s)Evidence: (validated|partial|invalid|unavailable)(?=$|\s[·]\s)/.exec(summary);
 return match?(match[1] as RecordedEvidence):"not-recorded";
}
export function filterByRecordedEvidence(runs:readonly AnalysisRun[],evidence:RecordedEvidence|"all"):AnalysisRun[]{
 return evidence==="all"?[...runs]:runs.filter(run=>recordedEvidence(run)===evidence);
}
