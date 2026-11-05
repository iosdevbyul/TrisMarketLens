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
 it("computes independent pipeline shares without treating other groups as the denominator",()=>{
  const rows=summarizePipelineEvidenceQuality([
   run("a","Market collection","Evidence: invalid"),
   run("b","Market collection","Evidence: unavailable"),
   run("c","DART session","Evidence: validated"),
   run("d","DART session","Evidence: partial"),
   run("e","DART session","Evidence: invalid")
  ]);
  const market=rows.find(row=>row.pipeline==="Market collection");
  const dart=rows.find(row=>row.pipeline==="DART session");
  const empty=rows.find(row=>row.total===0);
  expect(market&&summarizePipelineEvidenceIssueShare([market])).toEqual({issues:2,returned:2,percent:100});
  expect(dart&&summarizePipelineEvidenceIssueShare([dart])).toEqual({issues:1,returned:3,percent:33});
  expect(empty&&summarizePipelineEvidenceIssueShare([empty])).toEqual({issues:0,returned:0,percent:null});
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
