import {describe,it,expect} from "vitest";
import {diagnosticRemediations} from "./diagnosticRemediations";
describe("diagnostic remediation checklist",()=>{
 it("requests HTTP configuration when not connected",()=>expect(diagnosticRemediations("not_configured",[],false).map(x=>x.id)).toEqual(["configure"]));
 it("keeps transport failures separate from missing publication",()=>expect(diagnosticRemediations("transport_unavailable",[],true).map(x=>x.id)).toEqual(["transport"]));
 it("includes a ticker and explicit source failures without claiming approval",()=>{
  const ids=diagnosticRemediations("needs_review",[{name:"OHLCV",state:"error"}],false).map(x=>x.id);
  expect(ids).toEqual(["ticker","source-OHLCV","integrity"]);
 });
 it("still calls for provenance verification with apparently populated endpoints",()=>{
  const steps=diagnosticRemediations("partial_evidence",[{name:"OHLCV",state:"available"}],true);
  expect(steps.map(x=>x.id)).toEqual(["integrity"]);
 });
});
