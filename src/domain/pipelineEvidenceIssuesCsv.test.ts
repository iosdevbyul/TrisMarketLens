import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {selectPipelineEvidenceIssues,exportPipelineEvidenceIssuesCsv} from "./pipelineEvidenceIssuesCsv";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations pipeline evidence issues export",()=>{
 const runs=[
  run("missing","Market collection",null,"2026-11-01T00:00:00Z"),
  run("valid","Market collection","Evidence: validated","2026-11-01T00:00:00Z"),
  run("late-invalid","Market collection","Evidence: invalid","2026-11-03T00:00:00Z"),
  run("early-unavailable","Market collection","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
  run("unknown-invalid","Market collection","Evidence: invalid",null),
  run("partial","Market collection","Evidence: partial",null),
  run("other-invalid","Other adapter","Evidence: invalid",null),
  run("other-unavailable","Unlisted adapter","Evidence: unavailable",null),
  run("dart-invalid","DART session","Evidence: invalid",null)
 ];
 it("exports only selected explicit issues in oldest-first order without mutating source",()=>{
  const selected=selectPipelineEvidenceIssues(runs,"Market collection");
  expect(selected.map(item=>item.id)).toEqual(["early-unavailable","late-invalid","unknown-invalid"]);
  expect(runs[0].id).toBe("missing");
  const csv=exportPipelineEvidenceIssuesCsv(runs,"Market collection");
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Evidence status"');
  expect(csv.indexOf('"early-unavailable"')).toBeLessThan(csv.indexOf('"late-invalid"'));
  expect(csv).not.toContain('"missing"');
  expect(csv).not.toContain('"valid"');
  expect(csv).not.toContain('"partial"');
  expect(csv).not.toContain('"other-invalid"');
 });
 it("groups unknown pipeline names under Other",()=>{
  expect(selectPipelineEvidenceIssues(runs,"other").map(item=>item.id)).toEqual(["other-invalid","other-unavailable"]);
 });
 it("preserves the CSV header when no issues were returned",()=>{
  const csv=exportPipelineEvidenceIssuesCsv(runs,"DART batch acquisition");
  expect(csv.trim().split("\r\n")).toHaveLength(1);
 });
});
