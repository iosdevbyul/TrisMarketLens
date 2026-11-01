// Optional reviewed research security metadata; never a current listing or historical identity claim.
export interface SecurityMetadataDetail {
 version:"security_metadata_v1";fingerprint:string;
 security:{ticker:string;securityName:string|null;securityNameEnglish:string|null;nameStatus:"unavailable"|"verified_in_source_snapshot";corporationId:string|null;corporationRelationship:"verified_exact_dart_stock_code"|"unavailable";securityType:"unknown"|"common"|"preferred"|"other";market:"KOSPI";unavailableReasons:string[];historicalIdentityVerified:false;temporalScope:"current_display_metadata_only"};
 corporation:{corporationId:string;koreanName:string;englishName:string|null;verification:"verified_in_source_snapshot"}|null;
 sources:unknown[];historicalBoundaries:unknown[];
}
export interface SecurityMetadataResult{data:SecurityMetadataDetail|null;error:string|null}
function validate(value:unknown,ticker:string):value is SecurityMetadataDetail{
 if(!value||typeof value!=="object")return false;
 const d=value as Record<string,unknown>, s=d.security as Record<string,unknown>|null,c=d.corporation as Record<string,unknown>|null;
 return d.version==="security_metadata_v1"&&typeof d.fingerprint==="string"&&/^[0-9a-f]{64}$/.test(d.fingerprint)&&
 !!s&&s.ticker===ticker&&s.market==="KOSPI"&&s.temporalScope==="current_display_metadata_only"&&s.historicalIdentityVerified===false&&
 (s.securityName===null||typeof s.securityName==="string")&&(s.securityNameEnglish===null||typeof s.securityNameEnglish==="string")&&
 ["unavailable","verified_in_source_snapshot"].includes(String(s.nameStatus))&&
 ["unknown","common","preferred","other"].includes(String(s.securityType))&&
 (s.corporationId===null||typeof s.corporationId==="string")&&
 ["verified_exact_dart_stock_code","unavailable"].includes(String(s.corporationRelationship))&&
 (s.corporationId===null)===(s.corporationRelationship==="unavailable")&&
 Array.isArray(s.unavailableReasons)&&s.unavailableReasons.every(x=>typeof x==="string")&&
 (c===null||(typeof c==="object"&&c.corporationId===s.corporationId&&typeof c.koreanName==="string"&&(c.englishName===null||typeof c.englishName==="string")&&c.verification==="verified_in_source_snapshot"))&&
 Array.isArray(d.sources)&&Array.isArray(d.historicalBoundaries);
}
export async function loadSecurityMetadata(ticker:string,baseUrl:string|undefined,fetcher:typeof fetch=fetch):Promise<SecurityMetadataResult>{
 if(!/^[0-9A-Z]{6}$/.test(ticker))return {data:null,error:"Invalid ticker"};
 if(!baseUrl?.trim())return {data:null,error:"Metadata API not configured"};
 try{
  const url=baseUrl.trim().replace(/[/]+$/,"")+"/api/v1/security-metadata/"+ticker;
  const response=await fetcher(url,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(response.status===404)return {data:null,error:"No reviewed security metadata found for this ticker"};
  if(response.status===503)return {data:null,error:"Security metadata provider is not configured"};
  if(!response.ok)return {data:null,error:"Metadata API returned HTTP "+response.status};
  const body:unknown=await response.json();
  if(!validate(body,ticker))return {data:null,error:"Metadata API returned invalid security_metadata_v1"};
  return {data:body,error:null};
 }catch{return {data:null,error:"Security metadata API is unreachable"};}
}
export function getSecurityMetadata(ticker:string):Promise<SecurityMetadataResult>{
 if(process.env.MARKET_LENS_DATA_SOURCE!=="http")return Promise.resolve({data:null,error:"Security metadata requires HTTP mode"});
 return loadSecurityMetadata(ticker,process.env.DONGHAK_API_BASE_URL);
}
