import {describe,it,expect} from "vitest";
import {summarizeStatusEvidenceMatrix} from "./statusEvidenceMatrix";
import type {AnalysisRun} from "./operations";
const run=(id:string,state:AnalysisRun["state"],summary:string|null):AnalysisRun=>({id,state,summary,pipeline:"Market collection",startedAt:null,finishedAt:null,dataThrough:null});
describe("recorded status and evidence matrix",()=>{
 it("counts only explicitly returned execution/evidence pairs",()=>{
  const matrix=summarizeStatusEvidenceMatrix([
   run("a","failed","Evidence: invalid"),
   run("b","failed","Evidence: invalid"),
   run("c","unknown","Evidence: partial"),
   run("d","succeeded",null)
  ]);
  expect(matrix.failed.invalid).toBe(2);
  expect(matrix.unknown.partial).toBe(1);
  expect(matrix.succeeded["not-recorded"]).toBe(1);
  expect(matrix.succeeded.validated).toBe(0);
  expect(Object.values(matrix).flatMap(row=>Object.values(row)).reduce((a,b)=>a+b,0)).toBe(4);
 });
 it("initializes all thirty combinations to zero when no runs are returned",()=>{
  const matrix=summarizeStatusEvidenceMatrix([]);
  expect(Object.values(matrix).flatMap(row=>Object.values(row))).toHaveLength(30);
  expect(Object.values(matrix).every(row=>Object.values(row).every(count=>count===0))).toBe(true);
 });
});
