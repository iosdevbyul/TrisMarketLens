import type {AnalysisRun,AnalysisRunState} from "./operations";
export const recordedStates:readonly AnalysisRunState[]=["queued","running","succeeded","failed","blocked","unknown"];
export function summarizeReturnedRunStates(runs:readonly AnalysisRun[]):Record<AnalysisRunState,number>{
 const counts:Record<AnalysisRunState,number>={queued:0,running:0,succeeded:0,failed:0,blocked:0,unknown:0};
 for(const run of runs)counts[run.state]++;
 return counts;
}
