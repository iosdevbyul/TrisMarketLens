import {validateFreshnessReport,type FreshnessReport} from "../domain/dataFreshness";
export type FreshnessMode="disconnected"|"mock"|"http";
export interface FreshnessResult {source:FreshnessMode; report:FreshnessReport|null; error:string|null}
export interface FreshnessOptions {mode?:string;apiBaseUrl?:string;fetcher?:typeof fetch}
export const exampleFreshness:FreshnessReport={calendarId:"EXAMPLE-KRX-CALENDAR",expectedSession:"2026-10-01",validatedThrough:"2026-09-30",assessedAt:"2026-10-01T19:00:00+09:00",state:"delayed",reason:"Fictional demonstration only"};
export async function loadFreshness({mode="disconnected",apiBaseUrl,fetcher=fetch}:FreshnessOptions={}):Promise<FreshnessResult>{
 if(mode==="disconnected")return {source:"disconnected",report:null,error:null};
 if(mode==="mock")return {source:"mock",report:exampleFreshness,error:null};
 if(mode!=="http")return {source:"disconnected",report:null,error:"Unsupported freshness mode"};
 if(!apiBaseUrl?.trim())return {source:"http",report:null,error:"Freshness API base URL not configured"};
 try{
  const response=await fetcher(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/operations/freshness",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok)return {source:"http",report:null,error:`Freshness API returned HTTP ${response.status}`};
  const report:unknown=await response.json();
  if(!validateFreshnessReport(report))return {source:"http",report:null,error:"Freshness API returned an invalid report"};
  return {source:"http",report,error:null};
 }catch{return {source:"http",report:null,error:"Freshness API is unreachable"};}
}
export function getFreshness():Promise<FreshnessResult>{return loadFreshness({mode:process.env.MARKET_LENS_FRESHNESS_SOURCE??"disconnected",apiBaseUrl:process.env.DONGHAK_API_BASE_URL});}
