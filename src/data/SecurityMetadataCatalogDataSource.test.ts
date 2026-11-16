import { describe, expect, it, vi } from "vitest";
import { loadSecurityMetadataCatalog, projectSecurityCatalog } from "./SecurityMetadataCatalogDataSource";
const hash="a".repeat(64);
function fixture(){
  return {
    fingerprint:hash,
    artifact:{
      version:"security_metadata_v1",researchSnapshotSha256:hash,
      legacyStocksFingerprint:hash,pitVerified:false,operationalQualificationChanged:false,
      securities:[
        {ticker:"005930",securityName:null,securityNameEnglish:null,nameStatus:"unavailable",
          corporationId:"DART:00000001",corporationRelationship:"verified_exact_dart_stock_code",
          market:"KOSPI",historicalIdentityVerified:false,
          temporalScope:"current_display_metadata_only",
          unavailableReasons:["current_security_name_evidence_unavailable"]},
        {ticker:"035420",securityName:null,securityNameEnglish:null,nameStatus:"unavailable",
          corporationId:null,corporationRelationship:"unavailable",
          market:"KOSPI",historicalIdentityVerified:false,
          temporalScope:"current_display_metadata_only",
          unavailableReasons:["exact_dart_corporation_mapping_unavailable"]},
      ],
      corporations:[{corporationId:"DART:00000001",koreanName:"Sample Corporation"}],
      sources:[{evidenceId:"source"}],historicalBoundaries:[],
      limitations:["current_security_name_not_verified"],
    },
  };
}
describe("verified security metadata catalog",()=>{
  it("projects only public display fields without exporting private source evidence",()=>{
    const data=projectSecurityCatalog(fixture());
    expect(data).toMatchObject({universe:2,verifiedSecurityNames:0,linkedCorporations:1});
    expect(data?.items[0]).toMatchObject({
      ticker:"005930",corporationName:"Sample Corporation",nameVerified:false,
      historicalIdentityVerified:false,
    });
    expect(JSON.stringify(data)).not.toContain("rawSha256");
    expect(JSON.stringify(data)).not.toContain("legacyStocksFingerprint");
  });
  it("rejects invalid envelope flags, unknown corporations and unordered securities",()=>{
    const invalid=fixture();invalid.artifact.pitVerified=true;
    expect(projectSecurityCatalog(invalid)).toBeNull();
    const missing=fixture();missing.artifact.corporations=[];
    expect(projectSecurityCatalog(missing)).toBeNull();
    const reversed=fixture();reversed.artifact.securities.reverse();
    expect(projectSecurityCatalog(reversed)).toBeNull();
  });
  it("rejects nonloopback base URLs without calling the network",async()=>{
    const fetcher=vi.fn();
    const result=await loadSecurityMetadataCatalog("https://remote.example",fetcher as unknown as typeof fetch);
    expect(result.state).toBe("not_configured");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("separates unavailable publication, malformed body and successfully verified response",async()=>{
    const mock=(status:number,body:unknown) => vi.fn(async()=>({
      status,ok:status>=200&&status<300,headers:new Headers(),
      text:async()=>JSON.stringify(body),
    })) as unknown as typeof fetch;
    expect((await loadSecurityMetadataCatalog("http://127.0.0.1:8000",mock(503,{}))).state).toBe("unavailable");
    expect((await loadSecurityMetadataCatalog("http://127.0.0.1:8000",mock(200,{}))).state).toBe("unavailable");
    const result=await loadSecurityMetadataCatalog("http://127.0.0.1:8000",mock(200,fixture()));
    expect(result.state).toBe("available");
    expect(result.data?.universe).toBe(2);
  });
});
