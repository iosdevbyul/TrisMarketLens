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
 it("includes only header if filtered selection is empty",()=>expect(exportRecordedRunsCsv([]).split("\r\n").length).toBe(2));
});
