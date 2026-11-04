import {describe,it,expect} from "vitest";
import {selectMissingPipelineEvidence} from "./pipelineMissingEvidenceSelection";
describe("Operations missing evidence drilldown selection",()=>{
 it("selects pipeline and missing evidence from the default view",()=>{
  expect(selectMissingPipelineEvidence({pipeline:"all",evidence:"all"},"Market collection")).toEqual({pipeline:"Market collection",evidence:"not-recorded"});
 });
 it("toggles off the active combination",()=>{
  expect(selectMissingPipelineEvidence({pipeline:"DART session",evidence:"not-recorded"},"DART session")).toEqual({pipeline:"all",evidence:"all"});
 });
 it("replaces only the pipeline and evidence dimensions",()=>{
  expect(selectMissingPipelineEvidence({pipeline:"Market collection",evidence:"validated"},"other")).toEqual({pipeline:"other",evidence:"not-recorded"});
 });
});
