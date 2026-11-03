import {describe,it,expect} from "vitest";
import {exportRecordedRunsCsv} from "./operationsCsv";
import type {AnalysisRun} from "./operations";
describe("operations CSV export",()=>{
 it("includes only supplied rows and escapes commas, quotes and line breaks",()=>{
  const run:AnalysisRun={id:'run,"1"',pipeline:"Market collection",state:"unknown",startedAt:null,finishedAt:null,dataThrough:null,summary:'Evidence: partial\nSource: "audit", rows: 20'};
  const csv=exportRecordedRunsCsv([run]);
  expect(csv).toContain('"run,""1"""');
  expect(csv).toContain('"Evidence: partial\nSource: ""audit"", rows: 20"');
  expect(csv).toContain('"unknown"');
  expect(csv).not.toContain("succeeded");
 });
 it("prevents untrusted diagnostic formula execution",()=>{
  const row:AnalysisRun={id:"=HYPERLINK(1)",pipeline:"Market collection",state:"unknown",startedAt:null,finishedAt:null,dataThrough:null,summary:" @SUM(1)"};
  const csv=exportRecordedRunsCsv([row]);
  expect(csv).toContain('"\'=HYPERLINK(1)"');
  expect(csv).toContain('"\' @SUM(1)"');
 });
 it("exports evidence classification and measured duration in separate CSV columns",()=>{
  const row:AnalysisRun={id:"run-1",pipeline:"Market collection",state:"unknown",startedAt:"2026-11-03T00:00:00Z",finishedAt:"2026-11-03T00:01:30Z",dataThrough:null,summary:"Recorded status: completed · Evidence: partial · Source: sqlite_collection_audit"};
  const csv=exportRecordedRunsCsv([row]);
  expect(csv).toContain('"Evidence status"');
  expect(csv).toContain('"Elapsed time"');
  expect(csv).toContain('"partial"');
  expect(csv).toContain('"1m 30s"');
  expect(exportRecordedRunsCsv([{...row,finishedAt:null,summary:null}])).toContain('"not-recorded"');
 });
 it("exports overlapping attention reasons without treating missing evidence as failed",()=>{
  const failed:AnalysisRun={id:"failed-and-invalid",pipeline:"Market collection",state:"failed",startedAt:null,finishedAt:null,dataThrough:null,summary:"Evidence: invalid"};
  const unknown:AnalysisRun={...failed,id:"unknown",state:"unknown",summary:"Evidence: partial"};
  const csv=exportRecordedRunsCsv([failed,unknown]);
  const rows=csv.trim().split("\\r\\n");
  expect(rows[0]).toContain('"Attention reasons"');
  expect(rows[1]).toContain('"failed; invalid-evidence"');
  expect(rows[2]).toContain('"unknown","partial",""');
  expect(rows[2]).not.toContain('"failed"');
 });
 it("includes only header if filtered selection is empty",()=>expect(exportRecordedRunsCsv([]).split("\r\n").length).toBe(2));
});
