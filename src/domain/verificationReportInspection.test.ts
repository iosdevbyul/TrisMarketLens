import {describe,it,expect} from "vitest";
import {spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
describe("verification report inspector",()=>{
 const run=(statuses:Record<string,string>,unverified?:string[])=>{
  const dir=mkdtempSync(join(tmpdir(),"verification-"));
  const keys=["ci","http","extensions","evidence"];
  const file="verification.json";
  writeFileSync(join(dir,file),JSON.stringify({schemaVersion:"web_verification_v1",statuses,unverified:unverified??keys.filter(k=>statuses[k]!=="passed")}));
  const result=spawnSync(process.execPath,[join(process.cwd(),"scripts/inspect-verification-report.mjs"),file],{cwd:dir,encoding:"utf8"});
  rmSync(dir,{recursive:true,force:true});return result;
 };
 it("returns incomplete status for non-executed integration checks",()=>{
  const result=run({ci:"passed",http:"not_run",extensions:"not_run",evidence:"not_run"});
  expect(result.status).toBe(3);
  expect(result.stdout).toContain("Not run: http, extensions, evidence");
 });
 it("returns a failure exit status when an executed gate failed",()=>{
  const result=run({ci:"passed",http:"failed",extensions:"passed",evidence:"not_run"});
  expect(result.status).toBe(2);
 });
 it("distinguishes operator-entered passed statuses without certifying them",()=>{
  const result=run({ci:"passed",http:"passed",extensions:"passed",evidence:"passed"});
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("not independently certified");
 });
 it("rejects contradictory unverified claims",()=>{
  const result=run({ci:"passed",http:"not_run",extensions:"passed",evidence:"passed"},[]);
  expect(result.status).not.toBe(0);
 });
});
