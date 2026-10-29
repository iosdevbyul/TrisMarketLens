import { resolveFeatureSourceMode } from "./resolveFeatureSourceMode";
import {validateFreshnessReport,type FreshnessReport} from "../domain/dataFreshness";
export type FreshnessMode="disconnected"|"mock"|"http";
export interface FreshnessResult {source:FreshnessMode; report:FreshnessReport|null; error:string|null}
export interface FreshnessOptions {mode?:string;apiBaseUrl?:string;fetcher?:typeof fetch}
export const exampleFreshness:FreshnessReport={calendarId:"EXAMPLE-KRX-CALENDAR",expectedSession:"2026-10-01",validatedThrough:"2026-09-30",assessedAt:"2026-10-01T19:00:00+09:00",state:"delayed",reason:"Fictional demonstration only"};
type Evidence="validated"|"partial"|"invalid"|"unavailable";
interface SourceFreshness {sourceId:string;latestVerifiedDataAt:string|null;latestSuccessfulIngestionAt:string|null;latestDataDate:string|null;recordCount:number|null;thresholdSeconds:number|null;blockingReason:string|null;freshnessBasis:"acquisition_age"|"unavailable";freshnessStatus:"fresh"|"stale"|"unknown"|"blocked";evidenceStatus:Evidence}
const timestamp=(v:unknown)=>typeof v==="string"&&/(Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
const day=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v));
function validPayload(v:unknown):v is {schemaVersion:"operations_v1";items:SourceFreshness[]} {
 if(!v||typeof v!=="object")return false;
 const r=v as Record<string,unknown>;
 if(r.schemaVersion!=="operations_v1"||!Array.isArray(r.items)||r.items.length>1000)return false;
 const ids=new Set<string>();
 return r.items.every((entry:unknown)=>{
  if(!entry||typeof entry!=="object")return false;
  const a=entry as Record<string,unknown>;
  if(typeof a.sourceId!=="string"||!a.sourceId||ids.has(a.sourceId))return false;
  ids.add(a.sourceId);
  return [a.latestVerifiedDataAt,a.latestSuccessfulIngestionAt].every(x=>x===null||timestamp(x)) &&
   (a.latestDataDate===null||day(a.latestDataDate)) &&
   (a.recordCount===null||(Number.isInteger(a.recordCount)&&(a.recordCount as number)>=0)) &&
   (a.thresholdSeconds===null||(Number.isInteger(a.thresholdSeconds)&&(a.thresholdSeconds as number)>0)) &&
   (a.blockingReason===null||typeof a.blockingReason==="string") &&
   ["acquisition_age","unavailable"].includes(String(a.freshnessBasis)) &&
   ["fresh","stale","unknown","blocked"].includes(String(a.freshnessStatus)) &&
   ["validated","partial","invalid","unavailable"].includes(String(a.evidenceStatus));
 });
}
function adapt(payload:{items:SourceFreshness[]}):FreshnessReport {
 // Backend's acquisition-age policy is not an exchange-calendar assessment.
 // Keep all calendar conclusions unknown even when one acquisition is "fresh".
 const market=payload.items.find(item=>item.sourceId==="market_snapshot");
 return {calendarId:"Not supplied by backend",expectedSession:null,validatedThrough:market?.latestDataDate??null,assessedAt:null,state:"unknown",reason:market?.blockingReason??"Exchange calendar assessment unavailable"};
}
export async function loadFreshness({mode="disconnected",apiBaseUrl,fetcher=fetch}:FreshnessOptions={}):Promise<FreshnessResult>{
 if(mode==="disconnected")return {source:"disconnected",report:null,error:null};
 if(mode==="mock")return {source:"mock",report:exampleFreshness,error:null};
 if(mode!=="http")return {source:"disconnected",report:null,error:"Unsupported freshness mode"};
 if(!apiBaseUrl?.trim())return {source:"http",report:null,error:"Freshness API base URL not configured"};
 try{
  const response=await fetcher(apiBaseUrl.trim().replace(new RegExp("/+$"), "")+"/api/v1/operations/freshness",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok)return {source:"http",report:null,error:`Freshness API returned HTTP ${response.status}`};
  const body:unknown=await response.json();
  if(!validPayload(body))return {source:"http",report:null,error:"Freshness API returned an invalid operations_v1 payload"};
  const report=adapt(body);
  return validateFreshnessReport(report)?{source:"http",report,error:null}:{source:"http",report:null,error:"Freshness API returned an invalid report"};
 }catch{return {source:"http",report:null,error:"Freshness API is unreachable"};}
}
export function getFreshness():Promise<FreshnessResult>{return loadFreshness({mode:resolveFeatureSourceMode(process.env.MARKET_LENS_FRESHNESS_SOURCE, process.env.MARKET_LENS_DATA_SOURCE),apiBaseUrl:process.env.DONGHAK_API_BASE_URL});}
