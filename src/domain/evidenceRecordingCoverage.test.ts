import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizeStatusEvidenceMatrix} from "./statusEvidenceMatrix";
import {summarizeEvidenceRecording} from "./evidenceRecordingCoverage";
const run=(id:string,summary:string|null):AnalysisRun=>({id,state:"succeeded",pipeline:"Market collection",startedAt:null,finishedAt:null,dataThrough:null,summary});
describe("Operations evidence recording coverage",()=>{
 it("counts partial, invalid and unavailable as recorded, but not validated",()=>{
  const matrix=summarizeStatusEvidenceMatrix([
   run("a","Evidence: validated"),run("b","Evidence: partial"),
   run("c","Evidence: invalid"),run("d","Evidence: unavailable"),
   run("e",null)
  ]);
  expect(summarizeEvidenceRecording(matrix)).toEqual({
   total:5,recorded:4,notRecorded:1,validated:1,recordedPercent:80,notRecordedPercent:20
  });
 });
 it("uses zero rather than NaN when the API returns no runs",()=>{
  expect(summarizeEvidenceRecording(summarizeStatusEvidenceMatrix([]))).toEqual({
   total:0,recorded:0,notRecorded:0,validated:0,recordedPercent:0,notRecordedPercent:0
  });
 });
 it("does not infer explicit evidence from diagnostic prose",()=>{
  const coverage=summarizeEvidenceRecording(summarizeStatusEvidenceMatrix([run("x","possibly validated evidence")]));
  expect(coverage.recorded).toBe(0);
  expect(coverage.notRecordedPercent).toBe(100);
 });
});
