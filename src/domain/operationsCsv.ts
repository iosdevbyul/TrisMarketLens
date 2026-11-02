import type {AnalysisRun} from "@/domain/operations";
const columns=["Run ID","Pipeline","Recorded status","Started at","Finished at","Data through","Recorded diagnostic"];
function cell(value:string):string{
 const safe=/^\s*[=+@-]/.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function exportRecordedRunsCsv(runs:readonly AnalysisRun[]):string{
 const rows=runs.map(run=>[run.id,run.pipeline,run.state,run.startedAt??"",run.finishedAt??"",run.dataThrough??"",run.summary??""]);
 return "\uFEFF"+[columns,...rows].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
