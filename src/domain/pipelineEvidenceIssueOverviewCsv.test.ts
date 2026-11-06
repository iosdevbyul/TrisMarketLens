import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import {summarizePipelineEvidenceIssueOverview} from "./pipelineEvidenceIssueOverview";
import {exportPipelineEvidenceIssueOverviewCsv} from "./pipelineEvidenceIssueOverviewCsv";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations evidence issues overview CSV",()=>{
 it("exports an exact aggregate for API-returned issues with valid and missing starts",()=>{
  const runs=[
   run("a","Market collection","Evidence: invalid","2026-11-02T10:00:00Z"),
   run("b","DART session","Evidence: unavailable",null),
   run("c","External","Evidence: partial","2026-11-01T00:00:00Z"),
   run("d","Market collection","Evidence: validated","2026-10-01T00:00:00Z")
  ];
  const overview=summarizePipelineEvidenceIssueOverview(summarizePipelineEvidenceQuality(runs),summarizePipelineEvidenceIssueAge(runs));
  const csv=exportPipelineEvidenceIssueOverviewCsv(overview,runs.length);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Returned executions","Explicitly invalid","Explicitly unavailable","Total explicit issues","Explicit issue share"');
  expect(csv).toContain('"4","1","1","2","50%","2026-11-02T10:00:00.000Z","1"');
  expect(csv.trim().split("\r\n")).toHaveLength(2);
 });
 it("does not infer a share or timestamps from an empty response",()=>{
  const runs:AnalysisRun[]=[];
  const overview=summarizePipelineEvidenceIssueOverview(summarizePipelineEvidenceQuality(runs),summarizePipelineEvidenceIssueAge(runs));
  expect(exportPipelineEvidenceIssueOverviewCsv(overview,0)).toContain('"0","0","0","0","","","0"');
 });
 it("rejects invalid totals and missing denominator consistency",()=>{
  const overview={invalid:2,unavailable:0,total:2,missingStartTimes:2,oldestStartedAt:null};
  expect(()=>exportPipelineEvidenceIssueOverviewCsv(overview,1)).toThrow("Inconsistent evidence issue overview handoff");
 });
});
