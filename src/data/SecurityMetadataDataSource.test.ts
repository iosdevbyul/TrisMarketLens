import {describe,it,expect,vi} from "vitest";
import {loadSecurityMetadata} from "./SecurityMetadataDataSource";
const fixture={version:"security_metadata_v1",fingerprint:"a".repeat(64),security:{ticker:"005930",securityName:null,securityNameEnglish:null,nameStatus:"unavailable",corporationId:"DART:00126380",corporationRelationship:"verified_exact_dart_stock_code",securityType:"unknown",market:"KOSPI",unavailableReasons:["current_security_name_evidence_unavailable"],historicalIdentityVerified:false,temporalScope:"current_display_metadata_only"},corporation:{corporationId:"DART:00126380",koreanName:"삼성전자",englishName:"Samsung Electronics",verification:"verified_in_source_snapshot"},sources:[],historicalBoundaries:[]};
describe("Security metadata read-only API",()=>{
 it("requests published ticker route and preserves unavailable names",async()=>{
  const fetcher=vi.fn(async()=>Response.json(fixture));
  const r=await loadSecurityMetadata("005930","http://localhost:8000/",fetcher as typeof fetch);
  expect(r.error).toBeNull();expect(r.data?.security.securityName).toBeNull();
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/security-metadata/005930",expect.objectContaining({cache:"no-store"}));
 });
 it("fails closed when not configured",async()=>{
  const r=await loadSecurityMetadata("005930","http://localhost:8000",(async()=>new Response(null,{status:503})) as typeof fetch);
  expect(r.data).toBeNull();expect(r.error).toContain("not configured");
 });
 it("does not treat unapproved history as verified",async()=>{
  const r=await loadSecurityMetadata("005930","http://localhost:8000",(async()=>Response.json({...fixture,security:{...fixture.security,historicalIdentityVerified:true}})) as typeof fetch);
  expect(r.data).toBeNull();expect(r.error).toContain("invalid");
 });
 it("rejects wrong ticker before fetching",async()=>{
  const fetcher=vi.fn();
  const r=await loadSecurityMetadata("../evil","http://localhost:8000",fetcher as typeof fetch);
  expect(r.error).toContain("Invalid");expect(fetcher).not.toHaveBeenCalled();
 });
});
