import {isOperationalAlertSnapshot,type OperationalAlertSnapshot} from "../domain/operationalAlerts";
export type AlertMode="disconnected"|"mock"|"http";
export interface AlertResult{source:AlertMode;data:OperationalAlertSnapshot;error:string|null}
export interface AlertOptions{mode?:string;apiBaseUrl?:string;fetcher?:typeof fetch}
export const demoAlerts:OperationalAlertSnapshot={alerts:[
{id:"demo-alert-001",category:"freshness",severity:"warning",status:"open",title:"Example delayed data",description:"Fictional demonstration alert only.",occurredAt:"2026-10-01T19:00:00+09:00",resolvedAt:null,relatedRunId:null},
{id:"demo-alert-002",category:"inference",severity:"critical",status:"resolved",title:"Example blocked inference",description:"Fictional demonstration alert only.",occurredAt:"2026-09-30T19:00:00+09:00",resolvedAt:"2026-10-01T09:00:00+09:00",relatedRunId:"demo-001"}]};
export async function loadOperationalAlerts({mode="disconnected",apiBaseUrl,fetcher=fetch}:AlertOptions={}):Promise<AlertResult>{
 const empty:OperationalAlertSnapshot={alerts:[]};
 if(mode==="disconnected")return {source:"disconnected",data:empty,error:null};
 if(mode==="mock")return {source:"mock",data:demoAlerts,error:null};
 if(mode!=="http")return {source:"disconnected",data:empty,error:"Unsupported alerts mode"};
 if(!apiBaseUrl?.trim())return {source:"http",data:empty,error:"Alerts API base URL not configured"};
 try{
  const response=await fetcher(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/operations/alerts",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok)return {source:"http",data:empty,error:`Alerts API returned HTTP ${response.status}`};
  const data:unknown=await response.json();
  if(!isOperationalAlertSnapshot(data))return {source:"http",data:empty,error:"Alerts API returned invalid data"};
  return {source:"http",data,error:null};
 }catch{return {source:"http",data:empty,error:"Alerts API is unreachable"};}
}
export function getOperationalAlerts(){return loadOperationalAlerts({mode:process.env.MARKET_LENS_ALERTS_SOURCE??"disconnected",apiBaseUrl:process.env.DONGHAK_API_BASE_URL});}
