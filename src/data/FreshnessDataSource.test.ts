import {describe,it,expect,vi} from "vitest";
import {exampleFreshness,loadFreshness} from "./FreshnessDataSource";
import {validateFreshnessReport} from "../domain/dataFreshness";
const payload={schemaVersion:"operations_v1",items:[{sourceId:"market_snapshot",latestVerifiedDataAt:null,latestSuccessfulIngestionAt:null,latestDataDate:"2026-10-28",recordCount:100,thresholdSeconds:null,blockingReason:"timestamp_and_freshness_policy_unavailable",freshnessBasis:"unavailable",freshnessStatus:"unknown",evidenceStatus:"partial"}]};
describe("operations freshness contract",()=>{
 it("defaults to disconnected",async()=>expect((await loadFreshness()).report).toBeNull());
 it("keeps the fictional example isolated",()=>expect(validateFreshnessReport(exampleFreshness)).toBe(true));
 it("reads operations_v1 without inventing exchange calendar state",async()=>{
  const fetcher=vi.fn(async()=>Response.json(payload));
  const result=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});
  expect(result.error).toBeNull();expect(result.report?.state).toBe("unknown");expect(result.report?.validatedThrough).toBe("2026-10-28");
  expect(result.report?.expectedSession).toBeNull();expect(result.report?.assessedAt).toBeNull();
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/freshness",expect.objectContaining({cache:"no-store"}));
 });
 it("never maps acquisition freshness to exchange freshness",async()=>{
  const result=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json({...payload,items:[{...payload.items[0],freshnessStatus:"fresh",freshnessBasis:"acquisition_age",thresholdSeconds:3600}]})) as typeof fetch});
  expect(result.report?.state).toBe("unknown");
 });
 it("rejects malformed payload and transport errors",async()=>{
  const a=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(exampleFreshness)) as typeof fetch});
  expect(a.report).toBeNull();expect(a.error).toContain("invalid");
  const b=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:503})) as typeof fetch});
  expect(b.report).toBeNull();expect(b.error).toContain("503");
 });
});
