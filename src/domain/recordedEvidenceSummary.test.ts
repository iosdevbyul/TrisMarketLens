import {describe,it,expect} from "vitest";
import {summarizeRecordedEvidence} from "./recordedEvidenceSummary";
import type {AnalysisRun} from "./operations";
const run=(summary:string|null):AnalysisRun=>({id:String(summary),pipeline:"Market collection",state:"unknown",startedAt:null,finishedAt:null,dataThrough:null,summary});
describe("returned evidence summary",()=>{
 it("counts only explicitly recorded evidence values",()=>{
  expect(summarizeRecordedEvidence([run("Evidence: partial"),run("Recorded status: failed · Evidence: invalid"),run(null),run("maybe validated")])).toEqual({validated:0,partial:1,invalid:1,unavailable:0,"not-recorded":2});
 });
 it("does not invent categories for empty results",()=>expect(summarizeRecordedEvidence([])["not-recorded"]).toBe(0));
});
