import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
import {summarizePipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
import {formatPipelineTriageHandoff} from "./pipelineTriageHandoff";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("pipeline evidence recording handoff",()=>{
 it("separates explicit validation from recorded classifications and keeps UTC",()=>{
  const runs=[
   run("a","Market collection","Evidence: validated","2026-11-01T00:00:00Z"),
   run("b","Market collection","Evidence: invalid",null),
   run("c","Market collection",null,"2026-11-03T12:00:00+09:00"),
   run("d","Market collection",null,null)
  ];
  const coverage=summarizePipelineEvidenceCoverage(runs)[0];
  const triage=summarizePipelineMissingEvidenceTriage(runs)[0];
  const output=formatPipelineTriageHandoff(coverage,triage,summarizePipelineEvidenceQuality(runs)[0]);
  expect(output).toContain("Evidence recorded: 2");
  expect(output).toContain("Evidence validated (explicitly recorded): 1");
  expect(output).toContain("Evidence not recorded: 2");
  expect(output).toContain("Evidence invalid (explicitly recorded): 1");
  expect(output).toContain("Evidence partial (explicitly recorded): 0");
  expect(output).toContain("Evidence unavailable (explicitly recorded): 0");
  expect(output).toContain("Oldest missing-evidence start (UTC): 2026-11-03T03:00:00.000Z");
  expect(output).toContain("without a usable start time: 1");
  expect(output).toContain("not a complete execution history");
 });
 it("does not infer percentages or timestamps for empty results",()=>{
  const coverage=summarizePipelineEvidenceCoverage([])[1];
  const triage=summarizePipelineMissingEvidenceTriage([])[1];
  const output=formatPipelineTriageHandoff(coverage,triage,summarizePipelineEvidenceQuality([])[1]);
  expect(output).toContain("Unavailable (no returned executions)");
  expect(output).toContain("Oldest missing-evidence start (UTC): Unavailable");
  expect(output).not.toContain("NaN");
 });
 it("keeps grouped unknown pipelines explicit",()=>{
  const runs=[run("x","Custom",null,null)];
  const output=formatPipelineTriageHandoff(summarizePipelineEvidenceCoverage(runs)[3],summarizePipelineMissingEvidenceTriage(runs)[3],summarizePipelineEvidenceQuality(runs)[3]);
  expect(output).toContain("Pipeline: Other pipelines");
  expect(output).toContain("Evidence not recorded: 1");
 });
 it("rejects contradictory quality counts rather than copying misleading handoffs",()=>{
  const runs=[run("x","Market collection","Evidence: validated",null)];
  const quality={...summarizePipelineEvidenceQuality(runs)[0],invalid:1};
  expect(()=>formatPipelineTriageHandoff(summarizePipelineEvidenceCoverage(runs)[0],summarizePipelineMissingEvidenceTriage(runs)[0],quality)).toThrow("Inconsistent evidence classification counts");
 });
 it("rejects mismatched coverage and timestamp summaries",()=>{
  expect(()=>formatPipelineTriageHandoff(summarizePipelineEvidenceCoverage([])[0],summarizePipelineMissingEvidenceTriage([])[1],summarizePipelineEvidenceQuality([])[0])).toThrow("Mismatched pipeline");
 });
});
