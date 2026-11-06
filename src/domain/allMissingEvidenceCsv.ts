import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";
import {exportRecordedRunsCsv} from "./operationsCsv";

/** All missing-evidence records in the API-returned window, not a complete history. */
export function selectAllMissingEvidence(runs:readonly AnalysisRun[]):AnalysisRun[]{
 return runs.filter(run=>recordedEvidence(run)==="not-recorded").sort((a,b)=>{
  const at=a.startedAt?Date.parse(a.startedAt):NaN;
  const bt=b.startedAt?Date.parse(b.startedAt):NaN;
  if(!Number.isFinite(at))return Number.isFinite(bt)?1:0;
  if(!Number.isFinite(bt))return -1;
  return at-bt;
 });
}

export function exportAllMissingEvidenceCsv(runs:readonly AnalysisRun[]):string{
 return exportRecordedRunsCsv(selectAllMissingEvidence(runs));
}
