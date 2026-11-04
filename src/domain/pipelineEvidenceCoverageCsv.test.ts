import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import {exportPipelineEvidenceCoverageCsv} from "./pipelineEvidenceCoverageCsv";
const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({id,pipeline,summary,state:"unknown",startedAt:null,finishedAt:null,dataThrough:null});
describe("pipeline evidence recording CSV",()=>{
 it("exports exact recording counts and keeps validation separate",()=>{
  const rows=summarizePipelineEvidenceCoverage([
   run("a","Market collection","Evidence: invalid"),
   run("b","Market collection","Evidence: validated"),
   run("c","Market collection",null),
   run("d","Other adapter","Evidence: unavailable")
  ]);
  const csv=exportPipelineEvidenceCoverageCsv(rows);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Evidence recording rate"');
  expect(csv).toContain('"Market collection","3","2","1","1","67%"');
  expect(csv).toContain('"Other pipelines","1","1","0","0","100%"');
  expect(csv).toContain('"DART session","0","0","0","0",""');
  expect(csv.slice(1).trim().split("\r\n")).toHaveLength(5);
 });
 it("does not invent recording rates when the API returns no executions",()=>{
  const csv=exportPipelineEvidenceCoverageCsv(summarizePipelineEvidenceCoverage([]));
  expect(csv).toContain('"DART batch acquisition","0","0","0","0",""');
  expect(csv).not.toContain("NaN");
 });
});
