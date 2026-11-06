import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {selectAllMissingEvidence,exportAllMissingEvidenceCsv} from "./allMissingEvidenceCsv";

const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations all-pipeline missing evidence CSV",()=>{
 const runs=[
  run("late-missing","Market collection",null,"2026-11-04T00:00:00Z"),
  run("valid","DART session","Evidence: validated","2026-11-01T00:00:00Z"),
  run("early-missing","DART session","Other diagnostic","2026-11-02T09:00:00+09:00"),
  run("unknown-missing","External adapter",null,null),
  run("invalid","Market collection","Evidence: invalid",null),
  run("partial","External adapter","Evidence: partial",null),
  run("unavailable","DART session","Evidence: unavailable",null)
 ];
 it("selects only unclassified evidence across all pipelines oldest first and unknown timestamps last",()=>{
  expect(selectAllMissingEvidence(runs).map(item=>item.id)).toEqual(["early-missing","late-missing","unknown-missing"]);
  expect(runs[0].id).toBe("late-missing");
  const csv=exportAllMissingEvidenceCsv(runs);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Run ID","Pipeline","Recorded status","Evidence status"');
  expect(csv.indexOf('"early-missing"')).toBeLessThan(csv.indexOf('"late-missing"'));
  expect(csv).toContain('"External adapter"');
  for(const id of ["valid","invalid","partial","unavailable"])expect(csv).not.toContain('"'+id+'"');
 });
 it("exports only the header when all returned records contain explicit evidence",()=>{
  expect(exportAllMissingEvidenceCsv([runs[1],runs[4]]).trim().split("\r\n")).toHaveLength(1);
 });
 it("keeps spreadsheet formulas escaped with the existing CSV writer",()=>{
  const unsafe=run("=SUM(1,2)","External adapter",null,null);
  expect(exportAllMissingEvidenceCsv([unsafe])).toContain("\"'=SUM(1,2)\"");
 });
});
