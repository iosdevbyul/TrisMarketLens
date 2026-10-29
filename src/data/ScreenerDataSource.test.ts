import {describe,it,expect,vi} from "vitest";
import {demoScreener,loadScreener} from "./ScreenerDataSource";
import {filterScreener,isScreenerSnapshot} from "../domain/screener";
describe("AI screener",()=>{
 it("defaults to zero signals",async()=>{const r=await loadScreener();expect(r.data.entries).toEqual([])});
 it("has valid, fictional demo entries",()=>{expect(isScreenerSnapshot(demoScreener)).toBe(true)});
 it("filters and sorts without mutating the source",()=>{const f={query:"000660",direction:"down",validation:"blocked",sort:"score" as const};expect(filterScreener(demoScreener.entries,f)).toHaveLength(1);expect(demoScreener.entries).toHaveLength(3);});
 it("rejects out of bounds score and duplicate IDs",()=>{const d=demoScreener.entries[0];expect(isScreenerSnapshot({entries:[{...d,score:2}]})).toBe(false);expect(isScreenerSnapshot({entries:[d,d]})).toBe(false);});
 it("loads the dedicated endpoint without cache",async()=>{const fetcher=vi.fn(async()=>Response.json({entries:demoScreener.entries.map(e=>({...e,score:e.validation==="verified"?e.score:null}))}));const r=await loadScreener({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});expect(r.error).toBeNull();expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/analysis/screener",expect.objectContaining({cache:"no-store"}));});
 it("fails closed for HTTP failures",async()=>{const r=await loadScreener({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:503})) as typeof fetch});expect(r.data.entries).toEqual([]);expect(r.error).toContain("503");});
});

describe("published screener contract",()=>{
 it("rejects numeric scores from pending or blocked analysis",async()=>{
  const invalid={entries:[{...demoScreener.entries[0],validation:"pending",score:0.72}]};
  const result=await loadScreener({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(invalid)) as typeof fetch});
  expect(result.error).toContain("invalid");expect(result.data.entries).toEqual([]);
 });
 it("accepts reviewed numeric scores and null scores for pending entries",async()=>{
  const valid={entries:[{...demoScreener.entries[0],validation:"verified"},{...demoScreener.entries[2]}]};
  const result=await loadScreener({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(valid)) as typeof fetch});
  expect(result.error).toBeNull();expect(result.data.entries).toHaveLength(2);
 });
});
