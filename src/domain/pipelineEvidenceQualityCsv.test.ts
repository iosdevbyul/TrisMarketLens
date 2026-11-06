import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {exportPipelineEvidenceQualityCsv} from "./pipelineEvidenceQualityCsv";

const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({
 id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null
});
describe("Operations pipeline evidence quality CSV",()=>{
 it("exports exact explicit categories, issue share, and a UTF-8 BOM",()=>{
  const rows=summarizePipelineEvidenceQuality([
   run("a","Market collection","Evidence: validated"),
   run("b","Market collection","Evidence: partial"),
   run("c","Market collection","Evidence: invalid"),
   run("d","Market collection","Evidence: unavailable"),
   run("e","Market collection",null),
   run("f","External",null)
  ]);
  const csv=exportPipelineEvidenceQualityCsv(rows);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Pipeline","Returned executions","Validated","Partial","Invalid","Unavailable","Not recorded","Explicit issue share"');
  expect(csv).toContain('"Market collection","5","1","1","1","1","1","40%"');
  expect(csv).toContain('"Other pipelines","1","0","0","0","0","1","0%"');
  expect(csv.trim().split("\r\n")).toHaveLength(5);
 });
 it("leaves the issue-share denominator empty when no executions are returned",()=>{
  const csv=exportPipelineEvidenceQualityCsv(summarizePipelineEvidenceQuality([]));
  expect(csv).toContain('"DART session","0","0","0","0","0","0",""');
  expect(csv).not.toContain("NaN");
 });
 it("uses the exact per-pipeline denominator rather than the global returned count",()=>{
  const rows=summarizePipelineEvidenceQuality([
   run("a","Market collection","Evidence: invalid"),
   run("b","DART session","Evidence: validated"),
   run("c","DART session","Evidence: validated"),
   run("d","DART session","Evidence: unavailable")
  ]);
  const csv=exportPipelineEvidenceQualityCsv(rows);
  expect(csv).toContain('"Market collection","1","0","0","1","0","0","100%"');
  expect(csv).toContain('"DART session","3","2","0","0","1","0","33%"');
 });
 it("rejects inconsistent evidence counts instead of fabricating a percentage",()=>{
  const row=summarizePipelineEvidenceQuality([])[0];
  expect(()=>exportPipelineEvidenceQualityCsv([{...row,total:1,invalid:2}])).toThrow("Inconsistent pipeline evidence issue share");
 });
 it("escapes unsafe CSV values for spreadsheet consumers",()=>{
  const rows=summarizePipelineEvidenceQuality([]);
  const custom={...rows[0],pipeline:'=HYPERLINK("https://example.test")' as typeof rows[0]["pipeline"]};
  const csv=exportPipelineEvidenceQualityCsv([custom]);
  expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.test\"\")\"");
 });
});
