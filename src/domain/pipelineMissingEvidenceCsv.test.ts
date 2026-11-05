import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {exportPipelineMissingEvidenceCsv} from "./pipelineMissingEvidenceCsv";

const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({
 id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null
});
describe("pipeline missing-evidence export",()=>{
 const runs=[
  run("market-missing","Market collection",null),
  run("market-validated","Market collection","Evidence: validated"),
  run("dart-missing","DART session","Diagnostic only"),
  run("custom-missing","Custom adapter",null),
  run("other-missing","Another adapter",null),
  run("other-invalid","Custom adapter","Evidence: invalid")
 ];
 it("includes only the selected pipeline's missing evidence and preserves CSV headers",()=>{
  const csv=exportPipelineMissingEvidenceCsv(runs,"Market collection");
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Run ID","Pipeline","Recorded status","Evidence status"');
  expect(csv).toContain('"market-missing"');
  expect(csv).not.toContain("market-validated");
  expect(csv).not.toContain("dart-missing");
  expect(csv.trim().split("\r\n")).toHaveLength(2);
 });
 it("groups unknown pipelines under other without including recorded classifications",()=>{
  const csv=exportPipelineMissingEvidenceCsv(runs,"other");
  expect(csv).toContain('"custom-missing"');
  expect(csv).toContain('"other-missing"');
  expect(csv).not.toContain("other-invalid");
  expect(csv.trim().split("\r\n")).toHaveLength(3);
 });
 it("writes header only when no missing records are returned",()=>{
  const csv=exportPipelineMissingEvidenceCsv(runs,"DART batch acquisition");
  expect(csv.trim().split("\r\n")).toHaveLength(1);
  expect(csv).not.toContain("undefined");
 });
});
