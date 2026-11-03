import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";
import {recordedRunDuration} from "./recordedRunDuration";
import {listAttentionReasons} from "./attentionReasonSummary";

/** Read-only operator handoff. Recorded outcomes do not imply semantic approval. */
export function formatRecordedRunSummary(run:AnalysisRun):string{
 const values:[string,string][]=[
  ["Run ID",run.id],
  ["Pipeline",run.pipeline],
  ["Recorded execution state",run.state],
  ["Recorded evidence",recordedEvidence(run)],
  ["Started at (raw)",run.startedAt??"Not recorded"],
  ["Finished at (raw)",run.finishedAt??"Not recorded"],
  ["Elapsed time",recordedRunDuration(run)??"Unavailable"],
  ["Data through",run.dataThrough??"Not verified"],
  ["Attention reasons",listAttentionReasons(run).join("; ")||"None explicitly recorded"],
  ["Recorded diagnostics",run.summary??"Not supplied"],
  ["Validation note","Recorded execution state and evidence classification do not establish semantic approval."]
 ];
 return values.map(([label,value])=>label+": "+value).join("\n");
}
