import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineEvidenceQuality} from "./pipelineEvidenceQuality";
const run=(id:string,pipeline:string,summary:string|null):AnalysisRun=>({
 id,pipeline,summary,state:"succeeded",startedAt:null,finishedAt:null,dataThrough:null
});
describe("per-pipeline evidence classification",()=>{
 it("counts explicit categories and missing evidence without inferring approval from success",()=>{
  const rows=summarizePipelineEvidenceQuality([
   run("a","Market collection","Evidence: validated"),
   run("b","Market collection","Evidence: invalid"),
   run("c","Market collection","Evidence: partial"),
   run("d","Market collection","Evidence: unavailable"),
   run("e","Market collection",null),
   run("f","Market collection","possibly validated"),
   run("g","Custom adapter","Evidence: invalid")
  ]);
  expect(rows[0]).toEqual({pipeline:"Market collection",total:6,validated:1,partial:1,invalid:1,unavailable:1,"not-recorded":2});
  expect(rows[3].invalid).toBe(1);
  expect(rows.reduce((sum,row)=>sum+row.total,0)).toBe(7);
  expect(rows.every(row=>row.total===row.validated+row.partial+row.invalid+row.unavailable+row["not-recorded"])).toBe(true);
 });
 it("keeps all known pipeline rows when API returns none",()=>{
  const rows=summarizePipelineEvidenceQuality([]);
  expect(rows).toHaveLength(4);
  expect(rows.every(row=>row.total===0&&row.invalid===0&&row.unavailable===0)).toBe(true);
 });
});
