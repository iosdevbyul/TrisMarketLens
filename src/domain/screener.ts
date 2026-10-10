import type { AnalysisDirection, AnalysisValidation } from "./stockAnalysis";
export interface ScreenerEntry { ticker:string; name:string|null; analysisId:string; modelId:string; modelVersion:string; direction:AnalysisDirection; score:number|null; validation:AnalysisValidation; dataThrough:string; analyzedAt:string }
export interface ScreenerSnapshot { entries:ScreenerEntry[] }
export function isScreenerSnapshot(value:unknown):value is ScreenerSnapshot {
 if(!value||typeof value!=="object") return false;
 const records=(value as Record<string,unknown>).entries;
 if(!Array.isArray(records)||records.length>5000) return false;
 const seen=new Set<string>();
 return records.every((item:unknown)=>{
  if(!item||typeof item!=="object") return false;
  const r=item as Record<string,unknown>;
  if(!["up","down","neutral"].includes(String(r.direction))||!["verified","pending","blocked"].includes(String(r.validation))) return false;
  for(const key of ["ticker","analysisId","modelId","modelVersion","dataThrough","analyzedAt"]) if(typeof r[key]!=="string"||!r[key]) return false;
  if(r.name!==null&&typeof r.name!=="string") return false;
  if(r.score!==null&&(typeof r.score!=="number"||!Number.isFinite(r.score)||r.score<0||r.score>1)) return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.dataThrough as string)||!Number.isFinite(Date.parse(r.dataThrough as string)))return false;
  if(!/(Z|[+-]\d{2}:\d{2})$/.test(r.analyzedAt as string)||!Number.isFinite(Date.parse(r.analyzedAt as string)))return false;
  const id=r.ticker+":"+r.analysisId;
  if(seen.has(id))return false;seen.add(id);
  return true;
 });
}
export type ScreenerFilters={query:string;direction:string;validation:string;sort:"score"|"date"|"ticker"};
export function filterScreener(entries:ScreenerEntry[],filter:ScreenerFilters):ScreenerEntry[]{
 const q=filter.query.trim().toLowerCase();
 return entries.filter(e=>(!q||[e.ticker,e.name??"",e.modelId].some(s=>s.toLowerCase().includes(q)))&&(filter.direction==="all"||e.direction===filter.direction)&&(filter.validation==="all"||e.validation===filter.validation)).sort((a,b)=>{
 if(filter.sort==="ticker")return a.ticker.localeCompare(b.ticker)||a.analysisId.localeCompare(b.analysisId);
 if(filter.sort==="date")return b.analyzedAt.localeCompare(a.analyzedAt)||a.ticker.localeCompare(b.ticker);
 return (b.score??-1)-(a.score??-1)||a.ticker.localeCompare(b.ticker);
 });
}
