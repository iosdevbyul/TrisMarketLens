import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import {summarizePipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
import {exportPipelineTriageCsv} from "./pipelineTriageCsv";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,finishedAt:null,dataThrough:null,state:"succeeded"
});
describe("Operations pipeline triage CSV",()=>{
 it("preserves explicit evidence counts, normalized UTC timestamps, and other pipelines",()=>{
  const runs=[
   run("a","Market collection","Evidence: validated","2026-11-01T00:00:00Z"),
   run("b","Market collection",null,"2026-11-03T12:00:00+09:00"),
   run("c","Market collection",null,null),
   run("d","Custom adapter",null,null)
  ];
  const csv=exportPipelineTriageCsv(summarizePipelineEvidenceCoverage(runs),summarizePipelineMissingEvidenceTriage(runs));
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Oldest missing-evidence start (UTC)"');
  expect(csv).toContain('"Market collection","3","1","2","1","33%","2026-11-03T03:00:00.000Z","1"');
  expect(csv).toContain('"Other pipelines","1","0","1","0","0%","","1"');
  expect(csv.trim().split("\r\n")).toHaveLength(5);
 });
 it("keeps empty coverage rates and timestamps blank, not zero or invented",()=>{
  const csv=exportPipelineTriageCsv(summarizePipelineEvidenceCoverage([]),summarizePipelineMissingEvidenceTriage([]));
  expect(csv).toContain('"DART session","0","0","0","0","","","0"');
  expect(csv).not.toContain("NaN");
  expect(csv).not.toContain("undefined");
 });
 it("rejects absent triage rows instead of silently inventing values",()=>{
  expect(()=>exportPipelineTriageCsv(summarizePipelineEvidenceCoverage([]),[])).toThrow("Missing pipeline triage data");
 });
});
