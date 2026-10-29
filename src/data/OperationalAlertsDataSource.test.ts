import {describe,expect,it,vi} from "vitest";
import {demoAlerts,loadOperationalAlerts} from "./OperationalAlertsDataSource";
const alert={id:"missing-market",category:"missing_evidence",severity:"warning",basis:"advisory",sourceId:"market_snapshot",diagnostic:"evidence_missing",occurredAt:null,blockingStatus:"unknown",verifiedCount:null,requiredCount:null};
const payload={schemaVersion:"operations_v1",items:[alert],total:1,offset:0,limit:25};
describe("operations alerts contract",()=>{
 it("defaults to disconnected",async()=>expect((await loadOperationalAlerts()).data.alerts).toEqual([]));
 it("preserves advisory and unknown event time",async()=>{
  const fetcher=vi.fn(async()=>Response.json(payload));
  const r=await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});
  expect(r.error).toBeNull();expect(r.data.alerts[0].status).toBe("advisory");expect(r.data.alerts[0].occurredAt).toBeNull();
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/alerts?offset=0&limit=25",expect.objectContaining({cache:"no-store"}));
 });
 it("counts only recorded alerts as open",async()=>{
  const r=await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json({...payload,items:[{...alert,basis:"recorded",severity:"error"}]})) as typeof fetch});
  expect(r.data.alerts[0].status).toBe("open");expect(r.data.alerts[0].severity).toBe("critical");
 });
 it("rejects legacy and invalid payloads",async()=>{
  for(const data of [demoAlerts,{...payload,items:[{...alert,basis:"invalid"}]}]){
   const r=await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>Response.json(data)) as typeof fetch});
   expect(r.error).toContain("invalid");expect(r.data.alerts).toEqual([]);
  }
 });
 it("fails closed on HTTP errors",async()=>{
  const r=await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:503})) as typeof fetch});
  expect(r.error).toContain("503");expect(r.data.alerts).toEqual([]);
 });
});
