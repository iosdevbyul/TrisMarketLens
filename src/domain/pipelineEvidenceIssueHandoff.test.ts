import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {formatPipelineEvidenceIssueHandoff} from "./pipelineEvidenceIssueHandoff";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("pipeline evidence issues handoff",()=>{
 it("reports only explicit issues and observed timestamps",()=>{
  const runs=[
   run("a","Market collection","Evidence: invalid","2026-11-04T00:00:00Z"),
   run("b","Market collection","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
   run("c","Market collection","Evidence: invalid",null),
   run("d","Market collection","Evidence: validated","2026-10-01T00:00:00Z")
  ];
  const output=formatPipelineEvidenceIssueHandoff(summarizePipelineEvidenceQuality(runs)[0],summarizePipelineEvidenceIssueAge(runs)[0]);
  expect(output).toContain("Evidence invalid (explicitly recorded): 2");
  expect(output).toContain("Evidence unavailable (explicitly recorded): 1");
  expect(output).toContain("Total explicit evidence issues: 3");
  expect(output).toContain("Oldest issue execution start (UTC): 2026-11-02T00:00:00.000Z");
  expect(output).toContain("without a usable start time: 1");
  expect(output).toContain("not the time an issue was discovered");
 });
 it("keeps empty windows and grouped unknown pipelines explicit",()=>{
  const empty=formatPipelineEvidenceIssueHandoff(summarizePipelineEvidenceQuality([])[1],summarizePipelineEvidenceIssueAge([])[1]);
  expect(empty).toContain("Total explicit evidence issues: 0");
  expect(empty).toContain("Oldest issue execution start (UTC): Unavailable");
  const runs=[run("x","Custom adapter","Evidence: invalid",null)];
  expect(formatPipelineEvidenceIssueHandoff(summarizePipelineEvidenceQuality(runs)[3],summarizePipelineEvidenceIssueAge(runs)[3])).toContain("Pipeline: Other pipelines");
 });
 it("rejects inconsistent pipeline and classification counts",()=>{
  const q=summarizePipelineEvidenceQuality([])[0],a=summarizePipelineEvidenceIssueAge([])[0];
  expect(()=>formatPipelineEvidenceIssueHandoff(q,{...a,pipeline:"other"})).toThrow("Mismatched pipeline");
  expect(()=>formatPipelineEvidenceIssueHandoff({...q,invalid:1},a)).toThrow("Inconsistent evidence issue counts");
  expect(()=>formatPipelineEvidenceIssueHandoff(q,{...a,missingStartTimes:1})).toThrow("Inconsistent issue timestamp counts");
 });
});
