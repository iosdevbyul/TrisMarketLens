import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueAge} from "./pipelineEvidenceIssueAge";
import {exportPipelineEvidenceIssueAgeCsv} from "./pipelineEvidenceIssueAgeCsv";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations evidence issue age export",()=>{
 it("reports explicit invalid/unavailable counts and earliest observed UTC timestamps",()=>{
  const runs=[
   run("a","Market collection","Evidence: invalid","2026-11-04T00:00:00Z"),
   run("b","Market collection","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
   run("c","Market collection","Evidence: invalid",null),
   run("d","Market collection",null,"2026-10-01T00:00:00Z"),
   run("e","Custom adapter","Evidence: unavailable","invalid-date")
  ];
  const csv=exportPipelineEvidenceIssueAgeCsv(summarizePipelineEvidenceQuality(runs),summarizePipelineEvidenceIssueAge(runs));
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Market collection","2","1","3","2026-11-02T00:00:00.000Z","1"');
  expect(csv).toContain('"Other pipelines","0","1","1","","1"');
  expect(csv.trim().split("\r\n")).toHaveLength(5);
 });
 it("does not invent timestamps or incidents for empty returned windows",()=>{
  const csv=exportPipelineEvidenceIssueAgeCsv(summarizePipelineEvidenceQuality([]),summarizePipelineEvidenceIssueAge([]));
  expect(csv).toContain('"DART session","0","0","0","","0"');
  expect(csv).not.toContain("undefined");
 });
 it("follows the supplied pipeline row order",()=>{
  const quality=summarizePipelineEvidenceQuality([]);
  const age=summarizePipelineEvidenceIssueAge([]);
  const csv=exportPipelineEvidenceIssueAgeCsv([...quality].reverse(),age);
  expect(csv.indexOf('"Other pipelines"')).toBeLessThan(csv.indexOf('"Market collection"'));
 });
 it("rejects missing or contradictory age rows",()=>{
  const quality=summarizePipelineEvidenceQuality([]);
  const age=summarizePipelineEvidenceIssueAge([]);
  expect(()=>exportPipelineEvidenceIssueAgeCsv(quality,age.slice(1))).toThrow("Missing pipeline issue age");
  expect(()=>exportPipelineEvidenceIssueAgeCsv(quality,[{...age[0],issues:1},...age.slice(1)])).toThrow("Inconsistent pipeline issue age");
 });
});
