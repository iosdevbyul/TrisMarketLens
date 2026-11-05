import {describe,it,expect} from "vitest";
import {selectPipelineQualityReview} from "./pipelineQualityReview";
import {defaultRunFilters,parseSharedRunFilters,serializeSharedRunFilters} from "./sharedRunFilters";

describe("Operations explicit evidence quality review",()=>{
 it.each(["invalid","unavailable"] as const)("reviews %s evidence oldest first",evidence=>{
  expect(selectPipelineQualityReview(defaultRunFilters,"DART session",evidence)).toEqual({
   ...defaultRunFilters,pipeline:"DART session",evidence,sort:"oldest"
  });
 });
 it("clears masking filters for the selected Other pipeline without mutating input",()=>{
  const source={...defaultRunFilters,query:"old",pipeline:"Market collection",evidence:"validated",
   state:"failed",sort:"duration-longest",from:"2026-11-01",to:"2026-11-05",
   attention:true,attentionReason:"failed"};
  expect(selectPipelineQualityReview(source,"other","unavailable")).toEqual({
   ...defaultRunFilters,pipeline:"other",evidence:"unavailable",sort:"oldest"
  });
  expect(source.query).toBe("old");
 });
 it("round-trips review filters through a shareable URL",()=>{
  const selected=selectPipelineQualityReview(defaultRunFilters,"Market collection","invalid");
  const url=serializeSharedRunFilters("view=operations",selected);
  expect(url).toContain("view=operations");
  expect(parseSharedRunFilters(url)).toEqual(selected);
 });
});
