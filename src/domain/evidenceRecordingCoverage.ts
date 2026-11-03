import type {StatusEvidenceMatrix} from "./statusEvidenceMatrix";
import {statusEvidenceMatrixTotals} from "./statusEvidenceMatrix";

/** Evidence recording is not evidence validation. Counts include only returned executions. */
export function summarizeEvidenceRecording(matrix:StatusEvidenceMatrix){
 const totals=statusEvidenceMatrixTotals(matrix);
 const total=totals.total;
 const notRecorded=totals.byEvidence["not-recorded"];
 const recorded=total-notRecorded;
 const validated=totals.byEvidence.validated;
 return {
  total,recorded,notRecorded,validated,
  recordedPercent:total===0?0:Math.round(recorded/total*100),
  notRecordedPercent:total===0?0:Math.round(notRecorded/total*100)
 };
}
