import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "./route";
import {checkBackendHealth} from "@/data/backendHealth";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";

vi.mock("@/data/backendHealth",()=>({checkBackendHealth:vi.fn()}));
vi.mock("@/data/OperationalMarketDataSource",()=>({loadOperationalCatalog:vi.fn()}));

describe("health endpoint operational market status",()=>{
 beforeEach(()=>{
  vi.stubEnv("MARKET_LENS_DATA_SOURCE","http");
  vi.stubEnv("DONGHAK_API_BASE_URL","http://127.0.0.1:8000");
  vi.mocked(checkBackendHealth).mockResolvedValue({status:"ok",service:"DonghakStockVision",mode:"read_only"});
 });
 it("rejects an invalid source mode rather than reporting healthy",async()=>{
  vi.stubEnv("MARKET_LENS_DATA_SOURCE","experimental");
  const result=await GET();
  expect(result.status).toBe(503);
  expect(result.headers.get("cache-control")).toContain("no-store");
  const body=await result.json();
  expect(body).toMatchObject({status:"degraded",dataSource:"invalid",backend:{status:"misconfigured"}});
  expect(vi.mocked(checkBackendHealth)).not.toHaveBeenCalled();
 });
 it("redacts upstream operational errors and sends no-store response",async()=>{
  vi.mocked(loadOperationalCatalog).mockResolvedValue({data:null,error:"private/internal/collector.sqlite: secret"});
  const result=await GET();
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(JSON.stringify(await result.json())).not.toContain("private/internal");
 });
 it("reports an available operational catalog without claiming research approval",async()=>{
  vi.mocked(loadOperationalCatalog).mockResolvedValue({data:{schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",items:[],total:940,offset:0,limit:25},error:null});
  const result=await GET();
  expect(result.status).toBe(200);
  const body=await result.json();
  expect(body.operationalMarket).toEqual({status:"available",observedTickers:940,evidenceStatus:"unreviewed"});
 });
 it("keeps transport health separate from an unavailable optional snapshot",async()=>{
  vi.mocked(loadOperationalCatalog).mockResolvedValue({data:null,error:"Operational market snapshot is not configured"});
  const result=await GET();
  expect(result.status).toBe(200);
  expect((await result.json()).operationalMarket.status).toBe("unavailable");
 });
});
