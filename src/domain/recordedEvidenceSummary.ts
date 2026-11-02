import type {AnalysisRun} from "./operations";
import {recordedEvidence,type RecordedEvidence} from "./recordedEvidence";
export const evidenceCategories:readonly RecordedEvidence[]=["validated","partial","invalid","unavailable","not-recorded"];
export function summarizeRecordedEvidence(runs:readonly AnalysisRun[]):Record<RecordedEvidence,number>{
 const result:Record<RecordedEvidence,number>={validated:0,partial:0,invalid:0,unavailable:0,"not-recorded":0};
 for(const run of runs)result[recordedEvidence(run)]++;
 return result;
}
