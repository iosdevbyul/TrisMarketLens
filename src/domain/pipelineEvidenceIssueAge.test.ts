import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations evidence issue age",()=>{
 it("uses the earliest real UTC start of explicitly invalid or unavailable evidence",()=>{
  const rows=summarizePipelineEvidenceIssueAge([
   run("a","Market collection","Evidence: invalid","2026-11-04T00:00:00Z"),
   run("b","Market collection","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
   run("c","Market collection","Evidence: invalid",null),
   run("d","Market collection","Evidence: unavailable","unparseable"),
   run("e","Market collection",null,"2026-10-01T00:00:00Z"),
   run("f","Market collection","Evidence: partial","2026-10-01T00:00:00Z"),
   run("g","Custom pipeline","Evidence: invalid",null)
  ]);
  expect(rows[0]).toEqual({pipeline:"Market collection",issues:4,missingStartTimes:2,oldestStartedAt:"2026-11-02T00:00:00.000Z"});
  expect(rows[3]).toEqual({pipeline:"other",issues:1,missingStartTimes:1,oldestStartedAt:null});
  expect(rows[1]).toEqual({pipeline:"DART session",issues:0,missingStartTimes:0,oldestStartedAt:null});
 });
 it("does not infer issue age from freeform diagnostics or empty data",()=>{
  const rows=summarizePipelineEvidenceIssueAge([
   run("a","DART session","invalid diagnostic, not an evidence label","2026-01-01T00:00:00Z")
  ]);
  expect(rows[1]).toEqual({pipeline:"DART session",issues:0,missingStartTimes:0,oldestStartedAt:null});
  expect(summarizePipelineEvidenceIssueAge([])).toHaveLength(4);
 });
});
