import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {summarizeStatusEvidenceMatrix} from "./statusEvidenceMatrix";
import {exportStatusEvidenceMatrixCsv} from "./statusEvidenceMatrixCsv";
const run=(id:string,state:AnalysisRun["state"],summary:string|null):AnalysisRun=>({id,state,summary,pipeline:"Market collection",startedAt:null,finishedAt:null,dataThrough:null});
describe("status-evidence matrix CSV",()=>{
 it("exports all 30 combinations and margins using exactly the returned data",()=>{
  const matrix=summarizeStatusEvidenceMatrix([
   run("a","failed","Evidence: invalid"),
   run("b","failed","Evidence: invalid"),
   run("c","unknown","Evidence: partial"),
   run("d","succeeded",null)
  ]);
  const csv=exportStatusEvidenceMatrixCsv(matrix);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  const rows=csv.slice(1).trim().split("\r\n").map(line=>line.split(",").map(field=>field.replace(/^"|"$/g,"")));
  expect(rows).toHaveLength(8);
  expect(rows[0]).toEqual(["Execution status","validated","partial","invalid","unavailable","not-recorded","Row total"]);
  expect(rows.find(row=>row[0]==="failed")).toEqual(["failed","0","0","2","0","0","2"]);
  expect(rows.find(row=>row[0]==="succeeded")).toEqual(["succeeded","0","0","0","0","1","1"]);
  expect(rows.at(-1)).toEqual(["Column total","0","1","2","0","1","4"]);
 });
 it("exports zero margins for empty data rather than inventing records",()=>{
  const csv=exportStatusEvidenceMatrixCsv(summarizeStatusEvidenceMatrix([]));
  expect(csv).toContain('"Column total","0","0","0","0","0","0"');
 });
});
