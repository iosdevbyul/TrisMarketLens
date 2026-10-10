export type AlertSeverity="info"|"warning"|"critical";
export type AlertStatus="open"|"resolved";
export interface OperationalAlert {id:string;category:"freshness"|"pipeline"|"inference"|"other";severity:AlertSeverity;status:AlertStatus;title:string;description:string;occurredAt:string;resolvedAt:string|null;relatedRunId:string|null}
export interface OperationalAlertSnapshot {alerts:OperationalAlert[]}
const isTime=(s:unknown)=>typeof s==="string"&&/(Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s));
export function isOperationalAlertSnapshot(value:unknown):value is OperationalAlertSnapshot{
 if(!value||typeof value!=="object")return false;
 const entries=(value as Record<string,unknown>).alerts;
 if(!Array.isArray(entries)||entries.length>1000)return false;
 const ids=new Set<string>();
 return entries.every((entry:unknown)=>{
  if(!entry||typeof entry!=="object")return false;
  const a=entry as Record<string,unknown>;
  if(typeof a.id!=="string"||!a.id||ids.has(a.id))return false;ids.add(a.id);
  if(!["freshness","pipeline","inference","other"].includes(String(a.category))||!["info","warning","critical"].includes(String(a.severity))||!["open","resolved"].includes(String(a.status)))return false;
  if(typeof a.title!=="string"||!a.title||typeof a.description!=="string")return false;
  if(!isTime(a.occurredAt)||a.resolvedAt!==null&&!isTime(a.resolvedAt))return false;
  if(a.status==="open"&&a.resolvedAt!==null||a.status==="resolved"&&(a.resolvedAt===null||Date.parse(a.resolvedAt as string)<Date.parse(a.occurredAt as string)))return false;
  return a.relatedRunId===null||typeof a.relatedRunId==="string";
 });
}
export function filterOperationalAlerts(entries:OperationalAlert[],status:"all"|"open"|"resolved",severity:"all"|AlertSeverity):OperationalAlert[]{
 return entries.filter(e=>(status==="all"||e.status===status)&&(severity==="all"||e.severity===severity)).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||a.id.localeCompare(b.id));
}
