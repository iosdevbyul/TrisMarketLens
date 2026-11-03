import {describe,it,expect} from "vitest";
import {formatRecordedRunSummary} from "./recordedRunSummaryText";
import type {AnalysisRun} from "./operations";
const run:AnalysisRun={id:"run-42",pipeline:"Market collection",state:"failed",startedAt:"2026-11-03T00:00:00Z",finishedAt:"2026-11-03T00:02:00Z",dataThrough:null,summary:"Recorded status: failed · Evidence: invalid · Source: sqlite_collection_audit"};
describe("recorded run handoff summary",()=>{
 it("includes independent evidence, attention, and measured time",()=>{
  const output=formatRecordedRunSummary(run);
  expect(output).toContain("Run ID: run-42");
  expect(output).toContain("Recorded execution state: failed");
  expect(output).toContain("Recorded evidence: invalid");
  expect(output).toContain("Attention reasons: failed; invalid-evidence");
  expect(output).toContain("Elapsed time: 2m 0s");
  expect(output).toContain("Data through: Not verified");
  expect(output).toContain("do not establish semantic approval");
 });
 it("does not fabricate timestamps, evidence, or reasons",()=>{
  const output=formatRecordedRunSummary({...run,state:"unknown",startedAt:null,finishedAt:null,summary:null});
  expect(output).toContain("Recorded evidence: not-recorded");
  expect(output).toContain("Started at (raw): Not recorded");
  expect(output).toContain("Elapsed time: Unavailable");
  expect(output).toContain("Attention reasons: None explicitly recorded");
  expect(output).toContain("Recorded diagnostics: Not supplied");
 });
});
