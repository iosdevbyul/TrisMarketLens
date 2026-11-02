import {describe,it,expect} from "vitest";
import {summarizeAttentionReasons,filterByAttentionReason} from "./attentionReasonSummary";
import type {AnalysisRun} from "./operations";
const run=(state:AnalysisRun["state"],summary:string|null):AnalysisRun=>({id:state+summary,pipeline:"Market collection",state,summary,startedAt:null,finishedAt:null,dataThrough:null});
describe("attention reason counts",()=>{
 it("counts multiple explicit reasons for one run without claiming unique totals",()=>{
  expect(summarizeAttentionReasons([run("failed","Evidence: invalid"),run("blocked","Evidence: unavailable"),run("unknown",null)])).toEqual({failed:1,blocked:1,"invalid-evidence":1,"unavailable-evidence":1});
 });
 it("drills into one reason while allowing overlap",()=>{
  const rows=[run("failed","Evidence: invalid"),run("blocked","Evidence: invalid"),run("unknown",null)];
  expect(filterByAttentionReason(rows,"invalid-evidence")).toHaveLength(2);
  expect(filterByAttentionReason(rows,"failed")).toHaveLength(1);
  expect(filterByAttentionReason(rows,null)).toHaveLength(3);
 });
 it("does not infer a reason from free-text diagnostics",()=>{
  expect(summarizeAttentionReasons([run("unknown","Possibly invalid")])["invalid-evidence"]).toBe(0);
 });
});
