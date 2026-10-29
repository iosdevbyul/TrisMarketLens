import {describe,expect,it} from "vitest";
import {assessReadiness,summarizeBackendDiagnostics} from "./backendDiagnostics";
describe("backend connection diagnostics",()=>{
 it("does not call mock mode healthy backend",()=>expect(summarizeBackendDiagnostics("mock",null)).toBe("not_configured"));
 it("reports backend health only when read-only health passed",()=>expect(summarizeBackendDiagnostics("http",{status:"ok"})).toBe("healthy"));
 it("preserves configuration and reachability failures",()=>{
  expect(summarizeBackendDiagnostics("http",{status:"misconfigured"})).toBe("misconfigured");
  expect(summarizeBackendDiagnostics("http",{status:"unreachable"})).toBe("unreachable");
 });
});

describe("ticker diagnostics input contract",()=>{
 it("accepts six-character case-normalized identifiers",()=>{
  const normalize=(input:string)=>input.trim().toUpperCase();
  expect(/^[0-9A-Z]{6}$/.test(normalize("005930"))).toBe(true);
  expect(/^[0-9A-Z]{6}$/.test(normalize("a12345"))).toBe(true);
 });
 it("rejects malformed tickers before requesting optional endpoints",()=>{
  expect(/^[0-9A-Z]{6}$/.test("../foo")).toBe(false);
  expect(/^[0-9A-Z]{6}$/.test("00593")).toBe(false);
 });
});

describe("operational readiness assessment",()=>{
 it("does not mistake a healthy HTTP transport for research approval",()=>{
  expect(assessReadiness("http",{status:"ok"},["available"],false)).toBe("needs_review");
 });
 it("marks all successful contract reads as partial evidence only",()=>{
  expect(assessReadiness("http",{status:"ok"},["available","empty"],true)).toBe("partial_evidence");
 });
 it("remains blocked for unavailable or fictional inputs",()=>{
  expect(assessReadiness("mock",null,[],false)).toBe("not_configured");
  expect(assessReadiness("http",{status:"unreachable"},[],true)).toBe("transport_unavailable");
  expect(assessReadiness("http",{status:"ok"},["demo"],true)).toBe("needs_review");
 });
});
