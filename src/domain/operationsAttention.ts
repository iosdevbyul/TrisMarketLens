import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";
export function requiresOperationsAttention(run:AnalysisRun):boolean{
 const evidence=recordedEvidence(run);
 return run.state==="failed"||run.state==="blocked"||evidence==="invalid"||evidence==="unavailable";
}
export function filterRunsRequiringAttention(runs:readonly AnalysisRun[],enabled:boolean):AnalysisRun[]{
 return enabled?runs.filter(requiresOperationsAttention):[...runs];
}
