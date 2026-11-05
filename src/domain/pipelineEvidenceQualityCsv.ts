import type {PipelineEvidenceQuality} from "./pipelineEvidenceQuality";

/** Export explicit evidence classifications from the API-returned execution window only. */
export function exportPipelineEvidenceQualityCsv(rows:readonly PipelineEvidenceQuality[]):string{
 const values:(string|number)[][]=[
  ["Pipeline","Returned executions","Validated","Partial","Invalid","Unavailable","Not recorded"],
  ...rows.map(row=>[
   row.pipeline==="other"?"Other pipelines":row.pipeline,
   row.total,row.validated,row.partial,row.invalid,row.unavailable,row["not-recorded"]
  ])
 ];
 // Quoting every cell and escaping potential spreadsheet formulas preserves untrusted pipeline text.
 const cell=(value:string|number)=>{
  const raw=String(value);
  const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
 };
 return "\uFEFF"+values.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
