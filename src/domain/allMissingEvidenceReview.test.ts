import {describe,it,expect} from "vitest";
import {defaultRunFilters,parseSharedRunFilters,serializeSharedRunFilters} from "./sharedRunFilters";
import {selectAllMissingEvidenceReview} from "./allMissingEvidenceReview";

describe("review missing evidence across all pipelines",()=>{
 it("clears all masking filters and chooses oldest first",()=>{
  const selected=selectAllMissingEvidenceReview({
   query:"test",pipeline:"DART session",state:"failed",evidence:"invalid",
   sort:"duration-longest",from:"2026-11-01",to:"2026-11-05",
   attention:true,attentionReason:"failed"
  });
  expect(selected).toEqual({
   query:"",pipeline:"all",state:"all",evidence:"not-recorded",
   sort:"oldest",from:"",to:"",attention:false,attentionReason:null
  });
 });
 it("is idempotent and survives share-link serialization",()=>{
  const selected=selectAllMissingEvidenceReview(defaultRunFilters);
  expect(selectAllMissingEvidenceReview(selected)).toEqual(selected);
  expect(parseSharedRunFilters("?source=operations&"+serializeSharedRunFilters("",selected))).toEqual(selected);
 });
});
