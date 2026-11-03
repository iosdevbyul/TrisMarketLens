import type {StatusEvidenceMatrix} from "./statusEvidenceMatrix";
import {statusEvidenceMatrixTotals} from "./statusEvidenceMatrix";
import {recordedStates} from "./recordedRunSummary";
import {evidenceCategories} from "./recordedEvidenceSummary";

/** Export the same returned-record matrix and margins displayed in Operations. */
export function exportStatusEvidenceMatrixCsv(matrix:StatusEvidenceMatrix):string{
 const totals=statusEvidenceMatrixTotals(matrix);
 const rows:(string|number)[][]=[
  ["Execution status",...evidenceCategories,"Row total"],
  ...recordedStates.map(status=>[status,...evidenceCategories.map(evidence=>matrix[status][evidence]),totals.byState[status]]),
  ["Column total",...evidenceCategories.map(evidence=>totals.byEvidence[evidence]),totals.total]
 ];
 return "\uFEFF"+rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(",")).join("\r\n")+"\r\n";
}
