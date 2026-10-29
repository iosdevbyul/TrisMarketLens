import {isOperationalAlertSnapshot,type OperationalAlertSnapshot,type OperationalAlert} from "../domain/operationalAlerts";
export type AlertMode="disconnected"|"mock"|"http";
export interface AlertResult{source:AlertMode;data:OperationalAlertSnapshot;error:string|null}
export interface AlertOptions{mode?:string;apiBaseUrl?:string;fetcher?:typeof fetch}
export const demoAlerts:OperationalAlertSnapshot={alerts:[
{id:"demo-alert-001",category:"freshness",severity:"warning",status:"open",title:"Example delayed data",description:"Fictional demonstration alert only.",occurredAt:"2026-10-01T19:00:00+09:00",resolvedAt:null,relatedRunId:null},
{id:"demo-alert-002",category:"inference",severity:"critical",status:"resolved",title:"Example blocked inference",description:"Fictional demonstration alert only.",occurredAt:"2026-09-30T19:00:00+09:00",resolvedAt:"2026-10-01T09:00:00+09:00",relatedRunId:"demo-001"}]};
interface BackendAlert {id:string;category:string;severity:"warning"|"error";basis:"recorded"|"advisory";sourceId:string;diagnostic:string;occurredAt:string|null;blockingStatus:"blocked"|"unknown"|null;verifiedCount:number|null;requiredCount:number|null}
const categories=["pipeline_blocked","missing_evidence","validation_failure","execution_interruption","acquisition_failure","unresolved_reservation","freshness_unknown","freshness_stale"];
function validPayload(v:unknown):v is {schemaVersion:"operations_v1";items:BackendAlert[];total:number;offset:number;limit:number}{
 if(!v||typeof v!=="object")return false;
 const p=v as Record<string,unknown>;
 if(p.schemaVersion!=="operations_v1"||!Array.isArray(p.items)||p.items.length>25||p.offset!==0||p.limit!==25||!Number.isInteger(p.total)||(p.total as number)<p.items.length)return false;
 const ids=new Set<string>();
 return p.items.every((x:unknown)=>{
  if(!x||typeof x!=="object")return false;
  const a=x as Record<string,unknown>;
  if(typeof a.id!=="string"||!a.id||ids.has(a.id))return false;
  ids.add(a.id);
  return categories.includes(String(a.category))&&["warning","error"].includes(String(a.severity))&&["recorded","advisory"].includes(String(a.basis))&&
    typeof a.sourceId==="string"&&!!a.sourceId&&typeof a.diagnostic==="string"&&
    (a.occurredAt===null||(typeof a.occurredAt==="string"&&/(Z|[+-]\\d{2}:\\d{2})$/.test(a.occurredAt)&&Number.isFinite(Date.parse(a.occurredAt))))&&
    (a.blockingStatus===null||["blocked","unknown"].includes(String(a.blockingStatus)))&&
    [a.verifiedCount,a.requiredCount].every(n=>n===null||(Number.isInteger(n)&&(n as number)>=0));
 });
}
function adapt(item:BackendAlert):OperationalAlert{
 return {id:item.id,category:item.category.startsWith("freshness_")?"freshness":"pipeline",
 severity:item.severity==="error"?"critical":"warning",status:item.basis==="advisory"?"advisory":"open",
 title:item.category.replace(/_/g," "),description:`${item.diagnostic} · ${item.basis} evidence · ${item.sourceId}`,
 occurredAt:item.occurredAt,resolvedAt:null,relatedRunId:null};
}
export async function loadOperationalAlerts({mode="disconnected",apiBaseUrl,fetcher=fetch}:AlertOptions={}):Promise<AlertResult>{
 const empty:OperationalAlertSnapshot={alerts:[]};
 if(mode==="disconnected")return {source:"disconnected",data:empty,error:null};
 if(mode==="mock")return {source:"mock",data:demoAlerts,error:null};
 if(mode!=="http")return {source:"disconnected",data:empty,error:"Unsupported alerts mode"};
 if(!apiBaseUrl?.trim())return {source:"http",data:empty,error:"Alerts API base URL not configured"};
 try{
  const response=await fetcher(apiBaseUrl.trim().replace(new RegExp("/+$"), "")+"/api/v1/operations/alerts?offset=0&limit=25",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok)return {source:"http",data:empty,error:`Alerts API returned HTTP ${response.status}`};
  const body:unknown=await response.json();
  if(!validPayload(body))return {source:"http",data:empty,error:"Alerts API returned invalid operations_v1 data"};
  const data={alerts:body.items.map(adapt)};
  return isOperationalAlertSnapshot(data)?{source:"http",data,error:null}:{source:"http",data:empty,error:"Alerts API returned invalid data"};
 }catch{return {source:"http",data:empty,error:"Alerts API is unreachable"};}
}
export function getOperationalAlerts(){return loadOperationalAlerts({mode:process.env.MARKET_LENS_ALERTS_SOURCE??"disconnected",apiBaseUrl:process.env.DONGHAK_API_BASE_URL});}
