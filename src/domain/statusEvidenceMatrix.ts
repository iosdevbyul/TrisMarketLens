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

/** Margins are derived from returned records; totals never imply full history. */
export function statusEvidenceMatrixTotals(matrix:StatusEvidenceMatrix):{
 byState:Record<AnalysisRunState,number>;
 byEvidence:Record<RecordedEvidence,number>;
 total:number;
}{
 const byState={} as Record<AnalysisRunState,number>;
 const byEvidence={} as Record<RecordedEvidence,number>;
 for(const evidence of evidenceCategories)byEvidence[evidence]=0;
 let total=0;
 for(const state of recordedStates){
  let rowTotal=0;
  for(const evidence of evidenceCategories){
   const count=matrix[state][evidence];
   rowTotal+=count;
   byEvidence[evidence]+=count;
  }
  byState[state]=rowTotal;
  total+=rowTotal;
 }
 return {byState,byEvidence,total};
}
