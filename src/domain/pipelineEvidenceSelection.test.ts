import {describe,it,expect} from "vitest";
import {selectPipelineEvidence} from "./pipelineEvidenceSelection";
describe("pipeline evidence selection",()=>{
 it("selects the exact evidence class and retains the Other group",()=>{
  expect(selectPipelineEvidence({pipeline:"all",evidence:"all"},"other","invalid")).toEqual({pipeline:"other",evidence:"invalid"});
 });
 it("toggles only an identical selection off",()=>{
  expect(selectPipelineEvidence({pipeline:"DART session",evidence:"unavailable"},"DART session","unavailable")).toEqual({pipeline:"all",evidence:"all"});
  expect(selectPipelineEvidence({pipeline:"DART session",evidence:"invalid"},"DART session","partial")).toEqual({pipeline:"DART session",evidence:"partial"});
 });
 it("toggles combined invalid and unavailable issue selection per pipeline",()=>{
  expect(selectPipelineEvidence({pipeline:"all",evidence:"all"},"Market collection","issues")).toEqual({pipeline:"Market collection",evidence:"issues"});
  expect(selectPipelineEvidence({pipeline:"Market collection",evidence:"issues"},"Market collection","issues")).toEqual({pipeline:"all",evidence:"all"});
  expect(selectPipelineEvidence({pipeline:"Market collection",evidence:"issues"},"other","issues")).toEqual({pipeline:"other",evidence:"issues"});
 });
});
