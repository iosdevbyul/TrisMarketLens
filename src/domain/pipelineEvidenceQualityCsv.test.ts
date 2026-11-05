import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {exportPipelineEvidenceQualityCsv} from "./pipelineEvidenceQualityCsv";

const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({
 id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null
});
describe("Operations pipeline evidence quality CSV",()=>{
 it("exports exact explicit categories and a UTF-8 BOM",()=>{
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
  expect(csv).toContain('"Pipeline","Returned executions","Validated","Partial","Invalid","Unavailable","Not recorded"');
  expect(csv).toContain('"Market collection","5","1","1","1","1","1"');
  expect(csv).toContain('"Other pipelines","1","0","0","0","0","1"');
  expect(csv.trim().split("\r\n")).toHaveLength(5);
 });
 it("exports zero counts without guessing classification for no executions",()=>{
  const csv=exportPipelineEvidenceQualityCsv(summarizePipelineEvidenceQuality([]));
  expect(csv).toContain('"DART session","0","0","0","0","0","0"');
  expect(csv).not.toContain("NaN");
 });
 it("escapes unsafe CSV values for spreadsheet consumers",()=>{
  const rows=summarizePipelineEvidenceQuality([]);
  const custom={...rows[0],pipeline:'=HYPERLINK("https://example.test")' as typeof rows[0]["pipeline"]};
  const csv=exportPipelineEvidenceQualityCsv([custom]);
  expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.test\"\")\"");
 });
});
