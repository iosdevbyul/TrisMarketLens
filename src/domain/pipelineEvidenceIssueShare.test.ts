import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
import {summarizePipelineEvidenceIssueShare} from "./pipelineEvidenceIssueShare";

const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({
 id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null
});
describe("Operations evidence issue share",()=>{
 it("uses every returned execution as the denominator across pipeline groups",()=>{
  const rows=summarizePipelineEvidenceQuality([
   run("a","Market collection","Evidence: invalid"),
   run("b","DART session","Evidence: unavailable"),
   run("c","External","Evidence: partial"),
   run("d","External","Evidence: validated"),
   run("e","Market collection",null),
   run("f","DART session","Diagnostic only")
  ]);
  expect(summarizePipelineEvidenceIssueShare(rows)).toEqual({issues:2,returned:6,percent:33});
 });
 it("shows no percentage when the API returns zero executions",()=>{
  expect(summarizePipelineEvidenceIssueShare(summarizePipelineEvidenceQuality([]))).toEqual({issues:0,returned:0,percent:null});
 });
 it("does not infer failures from execution state or unrelated diagnostics",()=>{
  const rows=summarizePipelineEvidenceQuality([
   {...run("a","Market collection","invalid diagnostic"),state:"failed"},
   run("b","Market collection","Evidence: unavailable")
  ]);
  expect(summarizePipelineEvidenceIssueShare(rows)).toEqual({issues:1,returned:2,percent:50});
 });
 it("rejects impossible category totals",()=>{
  const rows=summarizePipelineEvidenceQuality([]);
  expect(()=>summarizePipelineEvidenceIssueShare([{...rows[0],invalid:1},...rows.slice(1)])).toThrow("Inconsistent pipeline evidence issue share");
 });
});
