import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import {summarizePipelineEvidenceIssueOverview} from "./pipelineEvidenceIssueOverview";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
const overview=(runs:AnalysisRun[])=>summarizePipelineEvidenceIssueOverview(
 summarizePipelineEvidenceQuality(runs),summarizePipelineEvidenceIssueAge(runs)
);
describe("Operations evidence issue overview",()=>{
 it("aggregates only explicit invalid and unavailable categories across pipelines",()=>{
  expect(overview([
   run("a","Market collection","Evidence: invalid","2026-11-05T00:00:00Z"),
   run("b","DART session","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
   run("c","Custom adapter","Evidence: invalid",null),
   run("d","DART session","Evidence: validated","2026-10-01T00:00:00Z"),
   run("e","Market collection",null,"2026-09-01T00:00:00Z"),
   run("f","Custom adapter","Evidence: partial",null)
  ])).toEqual({invalid:2,unavailable:1,total:3,missingStartTimes:1,oldestStartedAt:"2026-11-02T00:00:00.000Z"});
 });
 it("keeps empty and missing-time-only results honest",()=>{
  expect(overview([])).toEqual({invalid:0,unavailable:0,total:0,missingStartTimes:0,oldestStartedAt:null});
  expect(overview([run("a","Custom adapter","Evidence: invalid",null)])).toEqual({
   invalid:1,unavailable:0,total:1,missingStartTimes:1,oldestStartedAt:null
  });
 });
 it("rejects incomplete or contradictory category and timestamp summaries",()=>{
  const quality=summarizePipelineEvidenceQuality([]);
  const ages=summarizePipelineEvidenceIssueAge([]);
  expect(()=>summarizePipelineEvidenceIssueOverview(quality,ages.slice(1))).toThrow();
  expect(()=>summarizePipelineEvidenceIssueOverview([{...quality[0],invalid:1},...quality.slice(1)],ages)).toThrow();
  expect(()=>summarizePipelineEvidenceIssueOverview(quality,[{...ages[0],issues:1,missingStartTimes:0},...ages.slice(1)])).toThrow();
 });
});
