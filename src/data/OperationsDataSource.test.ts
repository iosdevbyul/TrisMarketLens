import { describe, expect, it, vi } from "vitest";
import { demonstrationOperations, loadOperations } from "./OperationsDataSource";
const backend = {
 schemaVersion:"operations_v1",total:1,offset:0,limit:25,evidenceStatus:"partial",diagnostic:null,
 items:[{id:"collection-123",operationType:"market_ingestion",startedAt:null,completedAt:"2026-10-29T13:00:00Z",executionStatus:"completed",evidenceStatus:"partial",recordCount:20,sourceType:"sqlite_collection_audit",semanticApproval:false,blockingStatus:null,diagnostic:"recorded_outcome_not_provenance"}],
};
describe("OperationsDataSource", () => {
 it("defaults to disconnected", async () => { const r=await loadOperations();expect(r.source).toBe("disconnected");expect(r.snapshot.runs).toEqual([]); });
 it("keeps mock mode explicitly separate", async () => { const r=await loadOperations({mode:"mock"});expect(r.snapshot).toEqual(demonstrationOperations); });
 it("requests the published runs route and preserves evidence uncertainty", async () => {
  const fetcher=vi.fn(async()=>Response.json(backend));
  const r=await loadOperations({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/runs?offset=0&limit=25",expect.objectContaining({cache:"no-store"}));
  expect(r.error).toBeNull();expect(r.snapshot.runs[0].state).toBe("unknown");expect(r.snapshot.runs[0].dataThrough).toBeNull();
  expect(r.snapshot.checkedAt).toBeNull();expect(r.snapshot.runs[0].summary).toContain("Evidence: partial");
 });
 it("fails closed on HTTP errors",async()=>{const r=await loadOperations({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:404})) as typeof fetch});expect(r.error).toContain("404");expect(r.snapshot.runs).toEqual([]);});
 it("rejects legacy and malformed payloads",async()=>{
  for(const input of [demonstrationOperations,{...backend,schemaVersion:"unknown"},{...backend,items:[backend.items[0],backend.items[0]]},{...backend,items:[{...backend.items[0],semanticApproval:true}]}]){
   const r=await loadOperations({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(input)) as typeof fetch});
   expect(r.error).toContain("invalid");expect(r.snapshot.runs).toEqual([]);
  }
 });
 it("does not invent a successful run from an unavailable source",async()=>{
  const r=await loadOperations({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json({...backend,items:[],total:0,evidenceStatus:"unavailable"})) as typeof fetch});
  expect(r.error).toBeNull();expect(r.snapshot.runs).toEqual([]);expect(r.snapshot.latestDataThrough).toBeNull();
 });
});
