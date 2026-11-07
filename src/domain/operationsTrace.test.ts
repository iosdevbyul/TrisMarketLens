import {describe,expect,it} from "vitest";
import {createOperationsTrace,type TraceInputs} from "./operationsTrace";

function input():TraceInputs{
 return {
  mode:"http",
  pinned:{state:"available",data:{
   schemaVersion:"operational_snapshot_summary_v1",evidenceStatus:"unreviewed",market:"KOSPI",
   observationCount:100,tickerCount:10,tradingDayCount:12,
   firstTradingDate:"2026-10-01",lastTradingDate:"2026-10-30"
  },error:null},
  catalog:{data:{schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",
    items:[{ticker:"005930",latestDataDate:"2026-10-30"}],total:10,offset:0,limit:25},error:null},
  operations:{source:"http",snapshot:{
   connection:"connected",checkedAt:null,latestDataThrough:null,nextScheduledRun:null,
   runs:[{id:"run-1",pipeline:"Market collection",state:"unknown",startedAt:null,
    finishedAt:null,dataThrough:null,summary:"Recorded only"}]},error:null},
  freshness:{source:"http",report:{calendarId:"Not supplied by backend",expectedSession:null,
   validatedThrough:"2026-10-30",assessedAt:null,state:"unknown",
   reason:"Exchange calendar unavailable"},error:null},
  alerts:{source:"http",data:{alerts:[]},error:null},
  scheduler:{data:null,error:"Diagnostics HTTP 503"},
  research:{universe:120,unresolvedSecurities:7,unexplainedTickerSessions:3},
  researchError:null,
  screener:{source:"http",count:0,error:null}
 };
}
describe("Recorded operations-to-research trace",()=>{
 it("keeps collected operational data separate from unresolved research blockers",()=>{
  const stages=createOperationsTrace(input());
  expect(stages.find(x=>x.key==="collection")?.state).toBe("observed");
  expect(stages.find(x=>x.key==="research")?.state).toBe("blocked");
  expect(stages.find(x=>x.key==="analysis")?.state).toBe("empty");
  expect(stages.find(x=>x.key==="scheduler")?.state).toBe("unavailable");
  expect(stages.find(x=>x.key==="runEvidence")?.detail).toContain("never grants semantic approval");
 });
 it("detects inconsistent frozen snapshot and catalog coverage",()=>{
  const data=input();
  data.catalog.data!.total=11;
  const catalog=createOperationsTrace(data).find(x=>x.key==="catalog");
  expect(catalog?.state).toBe("blocked");
  expect(catalog?.detail).toContain("differ");
 });
 it("does not treat alerts or empty first page as certification of full history",()=>{
  const stages=createOperationsTrace(input());
  expect(stages.find(x=>x.key==="alerts")?.detail).toContain("not certify");
  expect(stages.find(x=>x.key==="runEvidence")?.state).toBe("observed");
 });
 it("fails closed when remote sources return errors or are unconfigured",()=>{
  const data=input();
  data.pinned={state:"unconfigured",data:null,error:"HTTP 503"};
  data.operations.error="backend disconnected";
  data.screener={source:"http",count:0,error:"publication not configured"};
  const stages=createOperationsTrace(data);
  expect(stages.find(x=>x.key==="collection")?.state).toBe("unavailable");
  expect(stages.find(x=>x.key==="runEvidence")?.state).toBe("unavailable");
  expect(stages.find(x=>x.key==="analysis")?.state).toBe("unavailable");
 });
 it("never recasts fictional demo records as real market observations",()=>{
  const stages=createOperationsTrace({...input(),mode:"mock"});
  expect(stages).toHaveLength(1);
  expect(stages[0].state).toBe("demo");
 });
});
