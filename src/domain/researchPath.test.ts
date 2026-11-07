import {describe,expect,it} from "vitest";
import {buildResearchPath,researchPathHref,researchPathTicker,researchWorkbenchHref} from "./researchPath";
import type {JourneyInputs} from "./researchPath";

function input():JourneyInputs{
 return {mode:"http",ticker:"005930",source:{
  operational:{count:10,error:null},
  stocks:{count:25,includesTicker:true,error:null},
  models:{count:2,error:null},
  analysis:{count:3,error:null,source:"http"},
  evidence:{count:25,unresolvedSecurities:2,error:null},
  portfolios:{count:4,error:null},
  operations:{count:1,error:null,source:"http"}
 }};
}
describe("Integrated evidence journey",()=>{
 it("keeps an explicit source pathway from collection through historical portfolios",()=>{
  const stages=buildResearchPath(input());
  expect(stages.map(x=>x.id)).toEqual(["collection","identity","models","analysis","validation","portfolio","operations"]);
  expect(stages.find(x=>x.id==="identity")?.href).toBe("/stocks/005930");
  expect(stages.find(x=>x.id==="analysis")?.href).toBe("/research-workbench?ticker=005930");
  expect(stages.find(x=>x.id==="validation")?.status).toBe("blocked");
  expect(stages.find(x=>x.id==="portfolio")?.status).toBe("observed");
  expect(stages.find(x=>x.id==="operations")?.note).toContain("not semantic approval");
 });
 it("does not silently associate absent ticker identity with published analysis",()=>{
  const x=input();
  x.source.stocks.includesTicker=false;
  const stages=buildResearchPath(x);
  expect(stages.find(s=>s.id==="identity")?.href).toBe("/stocks");
  expect(stages.find(s=>s.id==="identity")?.note).toContain("not confirmed");
 });
 it("shows unavailable instead of fictional fallback when optional API is absent",()=>{
  const x=input();
  x.source.operational={count:null,error:"HTTP 503"};
  x.source.portfolios={count:null,error:"Archive not configured"};
  x.source.analysis={count:0,error:"HTTP 503",source:"http"};
  x.source.operations={count:0,error:"HTTP 503",source:"http"};
  const stages=buildResearchPath(x);
  for(const id of ["collection","portfolio","analysis","operations"]){
   expect(stages.find(s=>s.id===id)?.status).toBe("unavailable");
  }
 });
 it("distinguishes actual empty publication from failed HTTP transport",()=>{
  const x=input();
  x.source.analysis={count:0,error:null,source:"http"};
  x.source.portfolios={count:0,error:null};
  expect(buildResearchPath(x).find(s=>s.id==="analysis")?.status).toBe("empty");
  expect(buildResearchPath(x).find(s=>s.id==="portfolio")?.status).toBe("empty");
  x.source.analysis.error="Network unreachable";
  expect(buildResearchPath(x).find(s=>s.id==="analysis")?.status).toBe("unavailable");
 });
 it("refuses mock or disconnected feature sources as real HTTP evidence",()=>{
  const x=input();
  x.source.analysis.source="mock";
  x.source.operations.source="disconnected";
  expect(buildResearchPath(x).find(s=>s.id==="analysis")?.status).toBe("unavailable");
  expect(buildResearchPath(x).find(s=>s.id==="operations")?.status).toBe("unavailable");
  x.mode="mock";
  expect(buildResearchPath(x).every(s=>s.status==="demo")).toBe(true);
 });
 it("validates ticker-derived URL destinations without arbitrary path injection",()=>{
  expect(researchPathTicker("005930")).toBe("005930");
  expect(researchPathTicker("ab12cd")).toBe("AB12CD");
  for(const raw of ["../../","/00593","0000000","005930?","",null]){
   expect(researchPathTicker(raw)).toBeNull();
  }
  expect(researchPathHref("005930")).toBe("/research-path?ticker=005930");
  expect(researchWorkbenchHref("005930")).toBe("/research-workbench?ticker=005930");
  expect(researchPathHref("../../")).toBe("/research-path");
  expect(researchWorkbenchHref(null)).toBe("/research-workbench");
 });
});
