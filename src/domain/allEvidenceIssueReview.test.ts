import {describe,it,expect} from "vitest";
import {selectAllEvidenceIssueReview} from "./allEvidenceIssueReview";
import {defaultRunFilters,parseSharedRunFilters,serializeSharedRunFilters} from "./sharedRunFilters";

describe("all-pipeline explicit evidence issue reviews",()=>{
 const masked={
  query:"only this run",pipeline:"DART session",state:"failed",evidence:"validated",
  sort:"duration-longest",from:"2026-11-01",to:"2026-11-05",
  attention:true,attentionReason:"failed"
 };
 it.each(["invalid","unavailable","issues"] as const)("clears unrelated filters for %s and sorts oldest first",category=>{
  expect(selectAllEvidenceIssueReview(masked,category)).toEqual({
   ...defaultRunFilters,evidence:category,sort:"oldest"
  });
 });
 it("preserves the selected evidence in a share URL and is repeatable",()=>{
  const selected=selectAllEvidenceIssueReview(defaultRunFilters,"unavailable");
  expect(selectAllEvidenceIssueReview(selected,"unavailable")).toEqual(selected);
  const search=serializeSharedRunFilters("?source=operations",selected);
  expect(parseSharedRunFilters(search)).toEqual(selected);
  expect(new URLSearchParams(search).get("source")).toBe("operations");
 });
});
