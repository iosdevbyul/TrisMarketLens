import {describe,it,expect,vi} from "vitest";
import {exampleFreshness,loadFreshness} from "./FreshnessDataSource";
import {validateFreshnessReport} from "../domain/dataFreshness";
describe("exchange-calibrated freshness",()=>{
 it("defaults to unknown without calendar data",async()=>{expect((await loadFreshness()).report).toBeNull()});
 it("accepts a clearly fictional example",()=>{expect(validateFreshnessReport(exampleFreshness)).toBe(true)});
 it("rejects contradictory current or delayed states",()=>{
  expect(validateFreshnessReport({...exampleFreshness,state:"current"})).toBe(false);
  expect(validateFreshnessReport({...exampleFreshness,state:"delayed",validatedThrough:"2026-10-02"})).toBe(false);
 });
 it("uses a dedicated uncached API",async()=>{
  const fetcher=vi.fn(async()=>Response.json(exampleFreshness));
  const result=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});
  expect(result.error).toBeNull();expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/freshness",expect.objectContaining({cache:"no-store"}));
 });
 it("never claims fresh data on failed HTTP",async()=>{
  const result=await loadFreshness({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:503})) as typeof fetch});
  expect(result.report).toBeNull();expect(result.error).toContain("503");
 });
});
