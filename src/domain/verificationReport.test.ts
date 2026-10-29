import {describe,it,expect} from "vitest";
import {spawnSync} from "node:child_process";
describe("verification report generation",()=>{
 const run=(env:Record<string,string>)=>spawnSync(process.execPath,["scripts/create-verification-report.mjs"],{encoding:"utf8",env:{...process.env,...env}});
 it("defaults every independent gate to not_run",()=>{
  const r=run({VERIFY_CI_STATUS:"not_run",VERIFY_HTTP_STATUS:"not_run",VERIFY_EXTENSIONS_STATUS:"not_run",VERIFY_EVIDENCE_STATUS:"not_run"});
  expect(r.status).toBe(0);
  const data=JSON.parse(r.stdout);
  expect(data.unverified).toEqual(["ci","http","extensions","evidence"]);
 });
 it("never infers local evidence from passing CI",()=>{
  const r=run({VERIFY_CI_STATUS:"passed",VERIFY_HTTP_STATUS:"not_run",VERIFY_EXTENSIONS_STATUS:"not_run",VERIFY_EVIDENCE_STATUS:"not_run"});
  const data=JSON.parse(r.stdout);
  expect(data.statuses.http).toBe("not_run");
  expect(data.unverified).toContain("evidence");
 });
 it("rejects unknown status values",()=>{
  const r=run({VERIFY_HTTP_STATUS:"approved"});
  expect(r.status).not.toBe(0);
 });
});
