import {describe,it,expect} from "vitest";
import {filterRecordedRuns} from "./RecordedRunExplorer";
import type {AnalysisRun} from "@/domain/operations";
const make=(id:string,pipeline:string,state:AnalysisRun["state"]):AnalysisRun=>({id,pipeline,state,startedAt:null,finishedAt:null,dataThrough:null,summary:null});
const runs=[make("1","Market collection","unknown"),make("2","DART session","failed"),make("3","Custom","blocked")];
describe("recorded operation filters",()=>{
 it("preserves the complete returned list by default",()=>expect(filterRecordedRuns(runs,"all","all")).toEqual(runs));
 it("filters pipeline and state without changing data",()=>{
  expect(filterRecordedRuns(runs,"Market collection","unknown")).toEqual([runs[0]]);
  expect(filterRecordedRuns(runs,"DART session","unknown")).toEqual([]);
  expect(filterRecordedRuns(runs,"other","blocked")).toEqual([runs[2]]);
 });
});
