import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";
export type AttentionReason="failed"|"blocked"|"invalid-evidence"|"unavailable-evidence";
export const attentionReasons:readonly AttentionReason[]=["failed","blocked","invalid-evidence","unavailable-evidence"];
export function hasAttentionReason(run:AnalysisRun,reason:AttentionReason):boolean{
 if(reason==="failed"||reason==="blocked")return run.state===reason;
 const evidence=recordedEvidence(run);
 return reason==="invalid-evidence"?evidence==="invalid":evidence==="unavailable";
}
export function summarizeAttentionReasons(runs:readonly AnalysisRun[]):Record<AttentionReason,number>{
 const result:Record<AttentionReason,number>={failed:0,blocked:0,"invalid-evidence":0,"unavailable-evidence":0};
 for(const run of runs)for(const reason of attentionReasons)if(hasAttentionReason(run,reason))result[reason]++;
 return result;
}
