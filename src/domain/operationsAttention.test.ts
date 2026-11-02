import {describe,it,expect} from "vitest";
import {requiresOperationsAttention,filterRunsRequiringAttention} from "./operationsAttention";
import type {AnalysisRun} from "./operations";
const row=(id:string,state:AnalysisRun["state"],summary:string|null):AnalysisRun=>({id,state,summary,pipeline:"Market collection",startedAt:null,finishedAt:null,dataThrough:null});
describe("Operations attention selection",()=>{
 it("includes explicit failure, blocking, invalid and unavailable evidence without inferring success",()=>{
  const rows=[row("failed","failed",null),row("blocked","blocked",null),row("invalid","unknown","Evidence: invalid"),row("unavailable","unknown","Evidence: unavailable"),row("partial","unknown","Evidence: partial"),row("missing","unknown",null)];
  expect(filterRunsRequiringAttention(rows,true).map(x=>x.id)).toEqual(["failed","blocked","invalid","unavailable"]);
  expect(filterRunsRequiringAttention(rows,false)).toEqual(rows);
 });
 it("does not treat an unsupported message as invalid evidence",()=>expect(requiresOperationsAttention(row("x","unknown","Maybe invalid later"))).toBe(false));
});
