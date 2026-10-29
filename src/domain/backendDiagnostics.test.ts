import {describe,expect,it} from "vitest";
import {summarizeBackendDiagnostics} from "./backendDiagnostics";
describe("backend connection diagnostics",()=>{
 it("does not call mock mode healthy backend",()=>expect(summarizeBackendDiagnostics("mock",null)).toBe("not_configured"));
 it("reports backend health only when read-only health passed",()=>expect(summarizeBackendDiagnostics("http",{status:"ok"})).toBe("healthy"));
 it("preserves configuration and reachability failures",()=>{
  expect(summarizeBackendDiagnostics("http",{status:"misconfigured"})).toBe("misconfigured");
  expect(summarizeBackendDiagnostics("http",{status:"unreachable"})).toBe("unreachable");
 });
});
