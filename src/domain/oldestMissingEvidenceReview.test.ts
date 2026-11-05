import {describe,it,expect} from "vitest";
import {selectOldestMissingEvidenceReview} from "./oldestMissingEvidenceReview";
import {defaultRunFilters,parseSharedRunFilters,serializeSharedRunFilters} from "./sharedRunFilters";

describe("oldest-first missing evidence review",()=>{
 it("sets the selected pipeline to explicitly unrecorded evidence and oldest first",()=>{
  expect(selectOldestMissingEvidenceReview(defaultRunFilters,"Market collection")).toEqual({
   ...defaultRunFilters,pipeline:"Market collection",evidence:"not-recorded",sort:"oldest"
  });
 });
 it("clears filters that would hide returned missing records",()=>{
  const source={...defaultRunFilters,query:"abc",pipeline:"DART session",state:"failed",evidence:"validated",
   sort:"duration-longest",from:"2026-11-01",to:"2026-11-05",attention:true,attentionReason:"failed"};
  const result=selectOldestMissingEvidenceReview(source,"other");
  expect(result).toEqual({...defaultRunFilters,pipeline:"other",evidence:"not-recorded",sort:"oldest"});
  expect(source.query).toBe("abc");
 });
 it("preserves the selection through a shareable filter URL",()=>{
  const filters=selectOldestMissingEvidenceReview(defaultRunFilters,"DART batch acquisition");
  const url=serializeSharedRunFilters("source=operations",filters);
  expect(url).toContain("source=operations");
  expect(parseSharedRunFilters(url)).toEqual(filters);
 });
});
