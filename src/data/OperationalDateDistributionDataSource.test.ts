import {describe,it,expect} from "vitest";
import {loadOperationalDateDistribution} from "./OperationalDateDistributionDataSource";
const base="http://127.0.0.1:8000";
const make=(offset:number,total:number,dates:string[])=>({schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",total,offset,limit:25,items:dates.map((date,i)=>({ticker:String(offset+i).padStart(6,"0"),latestDataDate:date}))});
describe("complete operational date distribution",()=>{
 it("aggregates all pages without labeling a sample as the universe",async()=>{
  const fetcher=(async(url:string)=>Response.json(url.includes("offset=25")?make(25,26,["2026-10-30"]):make(0,26,Array.from({length:25},()=> "2026-10-29")))) as typeof fetch;
  const r=await loadOperationalDateDistribution(base,fetcher);
  expect(r.error).toBeNull();expect(r.data?.observedTickers).toBe(26);
  expect(r.data?.latestDates).toEqual([{date:"2026-10-30",count:1},{date:"2026-10-29",count:25}]);
  expect(r.data?.tickersByDate[0]).toEqual({date:"2026-10-30",tickers:["000025"]});
  expect(r.data?.tickersByDate[1].tickers).toHaveLength(25);
 });
 it("fails closed on changed total between pages",async()=>{
  const fetcher=(async(url:string)=>Response.json(url.includes("offset=25")?make(25,27,["2026-10-30"]):make(0,26,Array.from({length:25},()=> "2026-10-29")))) as typeof fetch;
  expect((await loadOperationalDateDistribution(base,fetcher)).data).toBeNull();
 });
 it("rejects incomplete page without publishing partial distribution",async()=>{
  const fetcher=(async(url:string)=>Response.json(url.includes("offset=25")?make(25,26,[]):make(0,26,Array.from({length:25},()=> "2026-10-29")))) as typeof fetch;
  expect((await loadOperationalDateDistribution(base,fetcher)).error).toContain("changed");
 });
 it("rejects snapshots outside bounded request budget",async()=>{
  const fetcher=(async()=>Response.json(make(0,2501,Array.from({length:25},()=> "2026-10-29")))) as typeof fetch;
  expect((await loadOperationalDateDistribution(base,fetcher)).error).toContain("safe request limit");
 });
});
