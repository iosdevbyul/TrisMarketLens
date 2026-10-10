import { isScreenerSnapshot, type ScreenerSnapshot } from "../domain/screener";
export type ScreenerMode="disconnected"|"mock"|"http";
export interface ScreenerResult { source:ScreenerMode; data:ScreenerSnapshot; error:string|null }
export interface ScreenerOptions { mode?:string; apiBaseUrl?:string; fetcher?:typeof fetch }
export const demoScreener:ScreenerSnapshot={entries:[
 {ticker:"005930",name:"Example A",analysisId:"demo-a1",modelId:"EXAMPLE-MODEL",modelVersion:"demo-v1",direction:"up",score:0.72,validation:"pending",dataThrough:"2026-10-01",analyzedAt:"2026-10-01T18:30:00+09:00"},
 {ticker:"000660",name:"Example B",analysisId:"demo-b1",modelId:"EXAMPLE-MODEL",modelVersion:"demo-v1",direction:"down",score:0.58,validation:"blocked",dataThrough:"2026-09-30",analyzedAt:"2026-09-30T18:30:00+09:00"},
 {ticker:"035420",name:"Example C",analysisId:"demo-c1",modelId:"EXAMPLE-MODEL",modelVersion:"demo-v1",direction:"neutral",score:null,validation:"pending",dataThrough:"2026-09-29",analyzedAt:"2026-09-29T18:30:00+09:00"}
]};
export async function loadScreener({mode="disconnected",apiBaseUrl,fetcher=fetch}:ScreenerOptions={}):Promise<ScreenerResult>{
 const empty:ScreenerSnapshot={entries:[]};
 if(mode==="disconnected")return {source:"disconnected",data:empty,error:null};
 if(mode==="mock")return {source:"mock",data:demoScreener,error:null};
 if(mode!=="http")return {source:"disconnected",data:empty,error:"Unsupported screener mode"};
 if(!apiBaseUrl?.trim())return {source:"http",data:empty,error:"Screener API base URL not configured"};
 try{
 const r=await fetcher(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/analysis/screener",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
 if(!r.ok)return {source:"http",data:empty,error:`Screener API returned HTTP ${r.status}`};
 const data:unknown=await r.json();
 if(!isScreenerSnapshot(data))return {source:"http",data:empty,error:"Screener API returned invalid data"};
 return {source:"http",data,error:null};
 }catch{return {source:"http",data:empty,error:"Screener API is unreachable"};}
}
export function getScreener(){return loadScreener({mode:process.env.MARKET_LENS_SCREENER_SOURCE??"disconnected",apiBaseUrl:process.env.DONGHAK_API_BASE_URL});}
