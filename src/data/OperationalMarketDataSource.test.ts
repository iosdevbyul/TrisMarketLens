import {describe,it,expect,vi} from "vitest";
import {loadOperationalBars,loadOperationalCatalog} from "./OperationalMarketDataSource";
const base="http://127.0.0.1:8000";
describe("operational snapshot display adapter",()=>{
 it("reads a real catalog contract without inferring the universe count",async()=>{
  const data={schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",items:[{ticker:"005930",latestDataDate:"2026-10-29"}],total:1,offset:0,limit:25};
  const fetcher=vi.fn(async()=>Response.json(data));
  const r=await loadOperationalCatalog(base,0,fetcher as typeof fetch);
  expect(r.data).toEqual(data);
  expect(fetcher).toHaveBeenCalledWith(base+"/api/v1/operational/stocks?offset=0&limit=25",expect.objectContaining({cache:"no-store"}));
 });
 it("rejects unexpected evidence claims",async()=>{
  const r=await loadOperationalCatalog(base,0,(async()=>Response.json({schemaVersion:"operational_market_v1",evidenceStatus:"validated",items:[],total:0,offset:0,limit:25})) as typeof fetch);
  expect(r.data).toBeNull();
  expect(r.error).toContain("contract");
 });
 it("displays exact source bars without synthetic fallback",async()=>{
  const raw={ticker:"005930",bars:[{date:"2026-10-29",open:100,high:110,low:90,close:105,volume:7}]};
  const r=await loadOperationalBars("005930",base,(async()=>Response.json(raw)) as typeof fetch);
  expect(r.data).toEqual(raw);
 });
 it("keeps unavailable API results explicit",async()=>{
  const r=await loadOperationalBars("005930",base,(async()=>new Response(null,{status:503})) as typeof fetch);
  expect(r.data).toBeNull();
  expect(r.error).toContain("503");
 });
});
