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
 it("keeps recorded execution state independent from its evidence classification",()=>{
  const completed=run("completed","Recorded status: completed · Evidence: unavailable · Source: sqlite_collection_audit");
  const failed=run("failed","Recorded status: failed · Evidence: validated · Source: dart_ledger");
  const succeededRun:AnalysisRun={...completed,state:"succeeded"};
  const failedRun:AnalysisRun={...failed,state:"failed"};
  expect(recordedEvidence(succeededRun)).toBe("unavailable");
  expect(recordedEvidence(failedRun)).toBe("validated");
  expect(recordedEvidence(run("missing","Recorded status: completed · Source: dart_ledger"))).toBe("not-recorded");
 });
 it("filters evidence independently of recorded execution state",()=>{
  const rows=[run("a","Evidence: invalid"),run("b","Evidence: partial"),run("c",null)];
  expect(filterByRecordedEvidence(rows,"invalid").map(item=>item.id)).toEqual(["a"]);
  expect(filterByRecordedEvidence(rows,"not-recorded").map(item=>item.id)).toEqual(["c"]);
  expect(filterByRecordedEvidence(rows,"all")).toEqual(rows);
 });
});
