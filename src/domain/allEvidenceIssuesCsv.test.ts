import {describe,it,expect} from "vitest";
import type {AnalysisRun} from "./operations";
import {selectAllEvidenceIssues,exportAllEvidenceIssuesCsv} from "./allEvidenceIssuesCsv";
const run=(id:string,pipeline:string,summary:string|null,startedAt:string|null):AnalysisRun=>({
 id,pipeline,summary,startedAt,state:"succeeded",finishedAt:null,dataThrough:null
});
describe("Operations all-pipeline evidence issues CSV",()=>{
 const runs=[
  run("missing","Market collection",null,"2026-11-01T00:00:00Z"),
  run("valid","DART session","Evidence: validated","2026-11-01T00:00:00Z"),
  run("late-invalid","Market collection","Evidence: invalid","2026-11-03T00:00:00Z"),
  run("early-unavailable","DART session","Evidence: unavailable","2026-11-02T09:00:00+09:00"),
  run("unknown-invalid","External adapter","Evidence: invalid",null),
  run("partial","External adapter","Evidence: partial",null),
  run("unknown-malformed","External adapter","potentially invalid",null)
 ];
 it("selects explicit issues across pipelines, oldest first, with unknown timestamps last",()=>{
  const selected=selectAllEvidenceIssues(runs);
  expect(selected.map(item=>item.id)).toEqual(["early-unavailable","late-invalid","unknown-invalid"]);
  expect(runs[0].id).toBe("missing");
  const csv=exportAllEvidenceIssuesCsv(runs);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Run ID","Pipeline","Recorded status","Evidence status"');
  expect(csv.indexOf('"early-unavailable"')).toBeLessThan(csv.indexOf('"late-invalid"'));
  for(const id of ["missing","valid","partial","unknown-malformed"])expect(csv).not.toContain('"'+id+'"');
  expect(csv).toContain('"External adapter"');
 });
 it("returns header only when no explicit issues were returned",()=>{
  const csv=exportAllEvidenceIssuesCsv([runs[0],runs[1]]);
  expect(csv.trim().split("\r\n")).toHaveLength(1);
 });
 it("reuses the spreadsheet-safe CSV encoder",()=>{
  const unsafe=run('=SUM(1,2)',"Market collection","Evidence: invalid",null);
  const csv=exportAllEvidenceIssuesCsv([unsafe]);
  expect(csv).toContain("\"'=SUM(1,2)\"");
 });
});
