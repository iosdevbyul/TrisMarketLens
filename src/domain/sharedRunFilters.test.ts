import {describe,it,expect} from "vitest";
import {parseSharedRunFilters,serializeSharedRunFilters,defaultRunFilters} from "./sharedRunFilters";
describe("shared Operations filters",()=>{
 it("round trips multiple filters while preserving unrelated URL arguments",()=>{
  const filters={...defaultRunFilters,query:"bad run",pipeline:"Market collection",state:"failed",evidence:"invalid",sort:"duration-longest",attention:true,attentionReason:"invalid-evidence",from:"2026-11-01",to:"2026-11-03"};
  const encoded=serializeSharedRunFilters("?view=compact",filters);
  expect(new URLSearchParams(encoded).get("view")).toBe("compact");
  expect(parseSharedRunFilters(encoded)).toEqual(filters);
 });
 it("rejects invalid states, dates and oversized search",()=>{
  const value=parseSharedRunFilters("?run_state=approved&run_evidence=verified&run_attentionReason=unsupported&run_from=2026-02-30&run_query="+"x".repeat(250));
  expect(value.attention).toBe(false);expect(value.attentionReason).toBeNull();expect(value.state).toBe("all");expect(value.evidence).toBe("all");expect(value.from).toBe("");expect(value.query).toHaveLength(200);
 }); it("round-trips combined evidence issues while preserving unrelated URL arguments",()=>{
  const filters={...defaultRunFilters,evidence:"issues",sort:"oldest"};
  const encoded=serializeSharedRunFilters("?view=compact",filters);
  expect(new URLSearchParams(encoded).get("view")).toBe("compact");
  expect(parseSharedRunFilters(encoded)).toEqual(filters);
 });
});
