import {describe,it,expect} from "vitest";
import {summarizeReturnedRunStates} from "./recordedRunSummary";
import type {AnalysisRun} from "./operations";
const run=(id:string,state:AnalysisRun["state"]):AnalysisRun=>({id,state,pipeline:"Market collection",startedAt:null,finishedAt:null,dataThrough:null,summary:null});
describe("returned execution summary",()=>{
 it("counts only received records without inventing validated success",()=>{
  expect(summarizeReturnedRunStates([run("a","unknown"),run("b","failed"),run("c","unknown")])).toEqual({queued:0,running:0,succeeded:0,failed:1,blocked:0,unknown:2});
 });
 it("handles an empty returned page",()=>{
  expect(Object.values(summarizeReturnedRunStates([])).every(value=>value===0)).toBe(true);
 });
});
