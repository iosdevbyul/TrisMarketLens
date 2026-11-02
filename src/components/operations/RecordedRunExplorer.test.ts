import {describe,it,expect} from "vitest";
import {filterRecordedRuns,sortRecordedRuns} from "./RecordedRunExplorer";
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
 it("searches recorded IDs and diagnostics case-insensitively within existing filters",()=>{
  const detailed=runs.map((run,i)=>({...run,summary:i===0?"Source: sqlite_collection_audit":i===1?"Evidence: partial":null}));
  expect(filterRecordedRuns(detailed,"all","all","COLLECTION")).toEqual([detailed[0]]);
  expect(filterRecordedRuns(detailed,"all","all","partial")).toEqual([detailed[1]]);
  expect(filterRecordedRuns(detailed,"DART session","failed"," PARTIAL ")).toEqual([detailed[1]]);
  expect(filterRecordedRuns(detailed,"Market collection","failed","collection")).toEqual([]);
 });
 it("sorts records by start time without mutating source and places unknown times last",()=>{
  const input=[{...runs[0],startedAt:"2026-11-01T12:00:00Z"},{...runs[1],startedAt:null},{...runs[2],startedAt:"2026-11-02T12:00:00Z"}];
  expect(sortRecordedRuns(input,"newest").map(x=>x.id)).toEqual(["3","1","2"]);
  expect(sortRecordedRuns(input,"oldest").map(x=>x.id)).toEqual(["1","3","2"]);
  expect(input.map(x=>x.id)).toEqual(["1","2","3"]);
 });
 it("sorts elapsed duration without inventing missing timestamps",()=>{
  const input=[
   {...runs[0],startedAt:"2026-11-01T10:00:00Z",finishedAt:"2026-11-01T10:01:00Z"},
   {...runs[1],startedAt:null,finishedAt:"2026-11-01T11:00:00Z"},
   {...runs[2],startedAt:"2026-11-01T10:00:00Z",finishedAt:"2026-11-01T10:05:00Z"}
  ];
  expect(sortRecordedRuns(input,"duration-longest").map(x=>x.id)).toEqual(["3","1","2"]);
  expect(sortRecordedRuns(input,"duration-shortest").map(x=>x.id)).toEqual(["1","3","2"]);
  expect(input.map(x=>x.id)).toEqual(["1","2","3"]);
 });
});
