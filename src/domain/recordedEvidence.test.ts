import {describe,it,expect} from "vitest";
import {recordedEvidence,filterByRecordedEvidence} from "./recordedEvidence";
import type {AnalysisRun} from "./operations";
const run=(id:string,summary:string|null):AnalysisRun=>({id,pipeline:"Market collection",state:"unknown",startedAt:null,finishedAt:null,dataThrough:null,summary});
describe("recorded evidence",()=>{
 it("recognizes only explicit supported backend evidence labels",()=>{
  expect(recordedEvidence(run("a","Recorded status: completed · Evidence: partial · Source: sqlite_collection_audit"))).toBe("partial");
  expect(recordedEvidence(run("b","Failure suspected; evidence might be invalid"))).toBe("not-recorded");
  expect(recordedEvidence(run("c",null))).toBe("not-recorded");
 });
 it("filters evidence independently of recorded execution state",()=>{
  const rows=[run("a","Evidence: invalid"),run("b","Evidence: partial"),run("c",null)];
  expect(filterByRecordedEvidence(rows,"invalid").map(item=>item.id)).toEqual(["a"]);
  expect(filterByRecordedEvidence(rows,"not-recorded").map(item=>item.id)).toEqual(["c"]);
  expect(filterByRecordedEvidence(rows,"all")).toEqual(rows);
 });
});
