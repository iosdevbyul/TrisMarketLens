import {recordedEvidence} from "./recordedEvidence";
import {recordedRunDuration} from "./recordedRunDuration";
import type {AnalysisRun} from "@/domain/operations";
const columns=["Run ID","Pipeline","Recorded status","Evidence status","Started at","Finished at","Elapsed time","Data through","Recorded diagnostic"];
function cell(value:string):string{
 const safe=/^\s*[=+@-]/.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function exportRecordedRunsCsv(runs:readonly AnalysisRun[]):string{
 const rows=runs.map(run=>[run.id,run.pipeline,run.state,recordedEvidence(run),run.startedAt??"",run.finishedAt??"",recordedRunDuration(run)??"",run.dataThrough??"",run.summary??""]);
 return "\uFEFF"+[columns,...rows].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
