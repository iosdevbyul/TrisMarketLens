import {describe,it,expect} from "vitest";
import {getActiveRunFilters} from "./activeRunFilters";
import {defaultRunFilters} from "./sharedRunFilters";
describe("active Operations filter descriptions",()=>{
 it("shows no chips for default filters",()=>expect(getActiveRunFilters(defaultRunFilters)).toEqual([]));
 it("describes all independently removable filters including attention reason",()=>{
  const fields={...defaultRunFilters,query:"audit",state:"failed",evidence:"invalid",from:"2026-11-01",to:"2026-11-03",attention:true,attentionReason:"invalid-evidence",sort:"duration-longest"};
  expect(getActiveRunFilters(fields).map(x=>x.key)).toEqual(["query","state","evidence","from","to","attention","attentionReason","sort"]);
 });
 it("does not misreport whitespace-only search as active",()=>expect(getActiveRunFilters({...defaultRunFilters,query:"  "})).toEqual([]));
});
