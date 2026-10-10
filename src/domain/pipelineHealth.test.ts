import {describe,expect,it} from "vitest";
import {derivePipelineHealth,classifyPipeline} from "./pipelineHealth";
import {disconnectedOperations,type AnalysisRun} from "./operations";
const run=(id:string,pipeline:string,state:AnalysisRun["state"],date:string):AnalysisRun=>({
 id,pipeline,state,startedAt:date,finishedAt:state==="succeeded"?date:null,dataThrough:"2026-10-01",summary:null
});
describe("pipeline health",()=>{
 it("never claims success while disconnected",()=>{
  const result=derivePipelineHealth(disconnectedOperations);
  expect(result.state).toBe("unknown");expect(result.stages.every(x=>x.state==="unknown")).toBe(true);
 });
 it("maps only explicitly defined pipeline labels",()=>{
  expect(classifyPipeline("Daily market validation")).toBe("validation");
  expect(classifyPipeline("Arbitrary successful job")).toBeNull();
 });
 it("preserves last success when the newest run fails",()=>{
  const earlier="2026-10-01T16:00:00+09:00",later="2026-10-02T16:00:00+09:00";
  const result=derivePipelineHealth({...disconnectedOperations,connection:"connected",runs:[
   run("good","model inference","succeeded",earlier),run("bad","model inference","failed",later)
  ]});
  expect(result.state).toBe("attention");
  expect(result.stages[2].state).toBe("failed");
  expect(result.stages[2].latestSuccessAt).toBe(earlier);
 });
 it("does not mark a partial pipeline as fully successful",()=>{
  const result=derivePipelineHealth({...disconnectedOperations,connection:"connected",runs:[run("a","data collection","succeeded","2026-10-01T16:00:00+09:00")]});
  expect(result.state).toBe("unknown");
 });
});
