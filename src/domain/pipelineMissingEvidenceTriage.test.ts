import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizePipelineMissingEvidenceTriage} from "./pipelineMissingEvidenceTriage";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("pipeline missing-evidence triage",()=>{
 it("uses the oldest valid UTC instant only among explicitly missing-evidence records",()=>{
  const rows=summarizePipelineMissingEvidenceTriage([
   run("a","Market collection",null,"2026-11-03T23:00:00+09:00"),
   run("b","Market collection","Evidence: validated","2026-01-01T00:00:00Z"),
   run("c","Market collection","Diagnostic only","2026-11-02T12:00:00Z"),
   run("d","Market collection",null,null),
   run("e","DART session","Evidence: invalid",null),
   run("f","Unknown source",null,"2026-11-04T00:00:00Z")
  ]);
  expect(rows[0]).toEqual({pipeline:"Market collection",missing:3,missingStartTimes:1,oldestStartedAt:"2026-11-02T12:00:00.000Z"});
  expect(rows[1]).toEqual({pipeline:"DART session",missing:0,missingStartTimes:0,oldestStartedAt:null});
  expect(rows[3]).toEqual({pipeline:"other",missing:1,missingStartTimes:0,oldestStartedAt:"2026-11-04T00:00:00.000Z"});
 });
 it("does not fabricate time when all missing records lack usable start timestamps",()=>{
  const rows=summarizePipelineMissingEvidenceTriage([
   run("a","DART batch acquisition",null,null),
   run("b","DART batch acquisition","Evidence: partial","2026-11-01T00:00:00Z"),
   run("c","DART batch acquisition",null,"invalid")
  ]);
  expect(rows[2]).toEqual({pipeline:"DART batch acquisition",missing:2,missingStartTimes:2,oldestStartedAt:null});
  expect(rows.reduce((sum,row)=>sum+row.missing,0)).toBe(2);
 });
 it("preserves four empty categories for no returned runs",()=>{
  const rows=summarizePipelineMissingEvidenceTriage([]);
  expect(rows).toHaveLength(4);
  expect(rows.every(row=>row.missing===0&&row.missingStartTimes===0&&row.oldestStartedAt===null)).toBe(true);
 });
});
