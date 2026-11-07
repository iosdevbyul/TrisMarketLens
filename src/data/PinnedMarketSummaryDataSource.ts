/** Pinned, unreviewed KRX observations. This read model never establishes research eligibility. */
export interface PinnedMarketSummary {
 schemaVersion:"operational_snapshot_summary_v1";
 evidenceStatus:"unreviewed";
 market:"KOSPI";
 observationCount:number;
 tickerCount:number;
 tradingDayCount:number;
 firstTradingDate:string|null;
 lastTradingDate:string|null;
}
export type PinnedSummaryResult={data:PinnedMarketSummary|null;error:string|null;state:"available"|"empty"|"unconfigured"|"failed"};
const day=(value:unknown):value is string=>
 typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+"T00:00:00Z"))&&
 new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
const count=(value:unknown):value is number=>Number.isSafeInteger(value)&&(value as number)>=0;
export function validPinnedMarketSummary(value:unknown):value is PinnedMarketSummary{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 if(v.schemaVersion!=="operational_snapshot_summary_v1"||v.evidenceStatus!=="unreviewed"||
  v.market!=="KOSPI"||![v.observationCount,v.tickerCount,v.tradingDayCount].every(count)||
  !(v.firstTradingDate===null||day(v.firstTradingDate))||
  !(v.lastTradingDate===null||day(v.lastTradingDate)))return false;
 const rows=v.observationCount as number,tickers=v.tickerCount as number,sessions=v.tradingDayCount as number;
 if(tickers>rows||sessions>rows||rows===0&&(tickers!==0||sessions!==0))return false;
 if(rows===0)return v.firstTradingDate===null&&v.lastTradingDate===null;
 return tickers>0&&sessions>0&&typeof v.firstTradingDate==="string"&&
  typeof v.lastTradingDate==="string"&&v.firstTradingDate<=v.lastTradingDate;
}
export async function loadPinnedMarketSummary(
 apiBaseUrl:string|undefined,fetcher:typeof fetch=fetch
):Promise<PinnedSummaryResult>{
 const base=apiBaseUrl?.trim().replace(/\/+$/,"")??"";
 if(!/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(base))
  return {state:"unconfigured",data:null,error:"Pinned operational source requires an explicit local HTTP backend."};
 try{
  const response=await fetcher(base+"/api/v1/operational/summary",{
   method:"GET",headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)
  });
  if(response.status===503)return {state:"unconfigured",data:null,error:"Pinned operational snapshot is not configured (HTTP 503)."};
  if(!response.ok)return {state:"failed",data:null,error:"Operational summary returned HTTP "+response.status+"."};
  const payload:unknown=await response.json();
  if(!validPinnedMarketSummary(payload))return {state:"failed",data:null,error:"Pinned operational summary contract mismatch."};
  return {state:payload.observationCount===0?"empty":"available",data:payload,error:null};
 }catch{
  return {state:"failed",data:null,error:"Pinned operational summary could not be retrieved."};
 }
}
