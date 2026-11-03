import type {AnalysisRun,AnalysisRunState} from "./operations";
import {recordedStates} from "./recordedRunSummary";
import {evidenceCategories} from "./recordedEvidenceSummary";
import {recordedEvidence,type RecordedEvidence} from "./recordedEvidence";

export type StatusEvidenceMatrix=Record<AnalysisRunState,Record<RecordedEvidence,number>>;
export function summarizeStatusEvidenceMatrix(runs:readonly AnalysisRun[]):StatusEvidenceMatrix{
 const matrix={} as StatusEvidenceMatrix;
 for(const status of recordedStates){
  const row={} as Record<RecordedEvidence,number>;
  for(const evidence of evidenceCategories)row[evidence]=0;
  matrix[status]=row;
 }
 for(const run of runs)matrix[run.state][recordedEvidence(run)]++;
 return matrix;
}
