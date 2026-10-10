import {describe,expect,it,vi} from "vitest";
import {demoAlerts,loadOperationalAlerts} from "./OperationalAlertsDataSource";
describe("alerts data source",()=>{
 it("defaults to disconnected without fabricating warnings",async()=>expect((await loadOperationalAlerts()).data.alerts).toEqual([]));
 it("reads the uncached endpoint",async()=>{
  const fetcher=vi.fn(async()=>Response.json(demoAlerts));
  expect((await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch})).error).toBeNull();
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/alerts",expect.objectContaining({cache:"no-store"}));
 });
 it("fails closed when backend is unavailable",async()=>{
  const result=await loadOperationalAlerts({mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:503})) as typeof fetch});
  expect(result.data.alerts).toEqual([]);expect(result.error).toContain("503");
 });
});
