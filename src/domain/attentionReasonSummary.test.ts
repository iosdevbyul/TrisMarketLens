import {describe,it,expect} from "vitest";
import {summarizeAttentionReasons} from "./attentionReasonSummary";
import type {AnalysisRun} from "./operations";
const run=(state:AnalysisRun["state"],summary:string|null):AnalysisRun=>({id:state+summary,pipeline:"Market collection",state,summary,startedAt:null,finishedAt:null,dataThrough:null});
describe("attention reason counts",()=>{
 it("counts multiple explicit reasons for one run without claiming unique totals",()=>{
  expect(summarizeAttentionReasons([run("failed","Evidence: invalid"),run("blocked","Evidence: unavailable"),run("unknown",null)])).toEqual({failed:1,blocked:1,"invalid-evidence":1,"unavailable-evidence":1});
 });
 it("does not infer a reason from free-text diagnostics",()=>{
  expect(summarizeAttentionReasons([run("unknown","Possibly invalid")])["invalid-evidence"]).toBe(0);
 });
});
