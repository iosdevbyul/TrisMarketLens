import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import {summarizePipelineEvidenceIssueOverview} from "./pipelineEvidenceIssueOverview";
import {formatPipelineEvidenceIssueOverviewHandoff} from "./pipelineEvidenceIssueOverviewHandoff";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
const handoff=(runs:AnalysisRun[])=>formatPipelineEvidenceIssueOverviewHandoff(
 summarizePipelineEvidenceIssueOverview(
  summarizePipelineEvidenceQuality(runs),summarizePipelineEvidenceIssueAge(runs)
 ),runs.length
);
describe("Operations evidence issues overview handoff",()=>{
 it("shares explicit totals and UTC starts across pipelines, without claiming approval",()=>{
  const summary=handoff([
   run("a","Market collection","Evidence: invalid","2026-11-05T00:00:00Z"),
   run("b","DART session","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
   run("c","Custom","Evidence: invalid",null),
   run("d","Market collection","Evidence: validated","2026-10-01T00:00:00Z")
  ]);
  expect(summary).toContain("4 API-returned executions");
  expect(summary).toContain("Evidence invalid (explicitly recorded): 2");
  expect(summary).toContain("Evidence unavailable (explicitly recorded): 1");
  expect(summary).toContain("Total explicit evidence issues: 3");
  expect(summary).toContain("Explicit issue share of API-returned executions: 75% (3 / 4)");
  expect(summary).toContain("not incident frequency, failure rate or whole-history coverage");
  expect(summary).toContain("2026-11-02T00:00:00.000Z");
  expect(summary).toContain("without a usable start time: 1");
  expect(summary).toContain("not incident discovery");
 });
 it("does not invent timestamps in an empty or unknown-start-only window",()=>{
  expect(handoff([])).toContain("Total explicit evidence issues: 0");
  expect(handoff([])).toContain("Explicit issue share of API-returned executions: Unavailable (0 / 0)");
  expect(handoff([])).toContain("Oldest issue execution start (UTC): Unavailable");
  expect(handoff([run("x","Other","Evidence: invalid",null)])).toContain(
   "Issue executions without a usable start time: 1"
  );
 });
 it("uses all returned executions rather than only explicitly recorded issue rows",()=>{
  const result=handoff([
   run("a","Market collection","Evidence: invalid",null),
   run("b","DART session","Evidence: partial",null),
   run("c","DART batch acquisition","Evidence: unavailable",null),
   run("d","Market collection","Evidence: validated",null),
   run("e","Other",null,null),
  ]);
  expect(result).toContain("Explicit issue share of API-returned executions: 40% (2 / 5)");
 });
 it("rejects contradictory totals and out-of-scope records",()=>{
  const valid={invalid:1,unavailable:0,total:1,missingStartTimes:1,oldestStartedAt:null};
  expect(()=>formatPipelineEvidenceIssueOverviewHandoff({...valid,total:2},2)).toThrow();
  expect(()=>formatPipelineEvidenceIssueOverviewHandoff(valid,0)).toThrow();
  expect(()=>formatPipelineEvidenceIssueOverviewHandoff({...valid,missingStartTimes:0},1)).toThrow();
  expect(()=>formatPipelineEvidenceIssueOverviewHandoff({...valid,total:0},1)).toThrow();
  expect(()=>formatPipelineEvidenceIssueOverviewHandoff({...valid,invalid:2,total:2},1)).toThrow();
 });
});
