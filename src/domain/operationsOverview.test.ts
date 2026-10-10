import {describe,expect,it} from "vitest";
import {summarizeOperationsOverview} from "./operationsOverview";
import {disconnectedOperations} from "./operations";
import {demoAlerts} from "../data/OperationalAlertsDataSource";
import {exampleFreshness} from "../data/FreshnessDataSource";
import type {AnalysisRun} from "./operations";
const operations={source:"disconnected" as const,snapshot:disconnectedOperations,error:null};
const freshness={source:"disconnected" as const,report:null,error:null};
const alerts={source:"disconnected" as const,data:{alerts:[]},error:null};
const run=(id:string,pipeline:string):AnalysisRun=>({id,pipeline,state:"succeeded",startedAt:"2026-10-01T10:00:00Z",finishedAt:"2026-10-01T11:00:00Z",dataThrough:"2026-10-01",summary:null});
describe("operations overview",()=>{
 it("does not declare healthy when disconnected",()=>expect(summarizeOperationsOverview(operations,freshness,alerts).state).toBe("unknown"));
 it("does not convert missing alerts into zero",()=>expect(summarizeOperationsOverview(operations,freshness,alerts).openAlerts).toBeNull());
 it("shows attention for explicitly reported incidents",()=>expect(summarizeOperationsOverview(operations,freshness,{source:"mock",data:demoAlerts,error:null}).state).toBe("attention"));
 it("requires all three independent sources for reported healthy",()=>{
 const complete={source:"http" as const,snapshot:{...disconnectedOperations,connection:"connected" as const,runs:[run("a","data collection"),run("b","data validation"),run("c","model inference")]},error:null};
 const fresh={source:"http" as const,report:{...exampleFreshness,state:"current" as const,validatedThrough:exampleFreshness.expectedSession},error:null};
 expect(summarizeOperationsOverview(complete,fresh,{source:"http",data:{alerts:[]},error:null}).state).toBe("reported_healthy");
 expect(summarizeOperationsOverview(complete,fresh,alerts).state).toBe("unknown");
 });
 it("retains known attention if another source fails",()=>{
 expect(summarizeOperationsOverview(operations,{source:"mock",report:exampleFreshness,error:null},alerts).state).toBe("attention");
 });
});
