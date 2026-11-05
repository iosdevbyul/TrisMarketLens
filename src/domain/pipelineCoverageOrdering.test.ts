import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import {summarizePipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
import {orderPipelineCoverage} from "./pipelineCoverageOrdering";
const run=(id:string,pipeline:string,startedAt:string|null,summary:string|null):AnalysisRun=>({
 id,pipeline,startedAt,summary,finishedAt:null,dataThrough:null,state:"succeeded"
});
const runs=[
 run("a","Market collection","2026-11-06T00:00:00Z",null),
 run("b","DART session","2026-11-01T00:00:00Z",null),
 run("c","DART session",null,null),
 run("d","Custom adapter","2026-11-02T00:00:00Z","Evidence: invalid"),
 run("e","Custom adapter","2026-11-03T00:00:00Z",null)
];
describe("pipeline coverage ordering",()=>{
 const coverage=summarizePipelineEvidenceCoverage(runs);
 const triage=summarizePipelineMissingEvidenceTriage(runs);
 it("keeps the original pipeline order by default without mutation",()=>{
  expect(orderPipelineCoverage(coverage,triage,"default").map(row=>row.pipeline)).toEqual(
   ["Market collection","DART session","DART batch acquisition","other"]
  );
  expect(coverage[0].pipeline).toBe("Market collection");
 });
 it("puts the greatest missing-evidence count first with stable ties",()=>{
  expect(orderPipelineCoverage(coverage,triage,"most-missing-first").map(row=>row.pipeline)).toEqual(
   ["DART session","Market collection","other","DART batch acquisition"]
  );
 });
 it("puts the oldest observed missing evidence first and unknown timestamps last",()=>{
  expect(orderPipelineCoverage(coverage,triage,"oldest-missing-first").map(row=>row.pipeline)).toEqual(
   ["DART session","other","Market collection","DART batch acquisition"]
  );
 });
 it("handles all empty API results without assigning a priority",()=>{
  const rows=summarizePipelineEvidenceCoverage([]);
  const times=summarizePipelineMissingEvidenceTriage([]);
  expect(orderPipelineCoverage(rows,times,"oldest-missing-first")).toEqual(rows);
  expect(orderPipelineCoverage(rows,times,"most-missing-first")).toEqual(rows);
 });
});
