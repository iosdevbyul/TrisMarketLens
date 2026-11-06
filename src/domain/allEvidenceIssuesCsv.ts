import type {AnalysisRun} from "./operations";
import {recordedEvidence} from "./recordedEvidence";
import {exportRecordedRunsCsv} from "./operationsCsv";

/** Select only explicitly invalid/unavailable evidence within the API-returned execution window. */
export function selectAllEvidenceIssues(runs:readonly AnalysisRun[]):AnalysisRun[]{
 return runs.filter(run=>{
  const category=recordedEvidence(run);
  return category==="invalid"||category==="unavailable";
 }).sort((a,b)=>{
  const at=a.startedAt?Date.parse(a.startedAt):NaN;
  const bt=b.startedAt?Date.parse(b.startedAt):NaN;
  if(!Number.isFinite(at))return Number.isFinite(bt)?1:0;
  if(!Number.isFinite(bt))return -1;
  return at-bt;
 });
}

export function exportAllEvidenceIssuesCsv(runs:readonly AnalysisRun[]):string{
 return exportRecordedRunsCsv(selectAllEvidenceIssues(runs));
}
