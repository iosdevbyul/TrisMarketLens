import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceCoverage} from "./pipelineEvidenceCoverage";
const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null});
describe("pipeline evidence recording coverage",()=>{
 it("keeps exact pipeline groups, other grouping, and evidence validation independent",()=>{
  const rows=summarizePipelineEvidenceCoverage([
   run("a","Market collection","Evidence: validated"),
   run("b","Market collection","Evidence: invalid"),
   run("c","Market collection",null),
   run("d","DART session","Evidence: partial"),
   run("e","Custom adapter","Evidence: unavailable"),
   run("f","Different adapter",null)
  ]);
  expect(rows.find(row=>row.pipeline==="Market collection")).toEqual({pipeline:"Market collection",total:3,recorded:2,notRecorded:1,validated:1,recordedPercent:67});
  expect(rows.find(row=>row.pipeline==="DART session")?.recordedPercent).toBe(100);
  expect(rows.find(row=>row.pipeline==="DART batch acquisition")?.recordedPercent).toBeNull();
  expect(rows.find(row=>row.pipeline==="other")).toEqual({pipeline:"other",total:2,recorded:1,notRecorded:1,validated:0,recordedPercent:50});
  expect(rows.reduce((total,row)=>total+row.total,0)).toBe(6);
 });
 it("reports unavailable rates rather than zero percent when no records exist",()=>{
  expect(summarizePipelineEvidenceCoverage([]).every(row=>row.total===0&&row.recordedPercent===null)).toBe(true);
 });
 it("does not infer evidence from freeform diagnostics",()=>{
  const rows=summarizePipelineEvidenceCoverage([run("x","DART session","potentially validated")]);
  expect(rows[1].notRecorded).toBe(1);
  expect(rows[1].validated).toBe(0);
 });
});
