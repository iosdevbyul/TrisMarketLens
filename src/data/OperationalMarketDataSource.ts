import {isOhlcvSeries,type OhlcvSeries} from "../domain/ohlcv";
export interface OperationalTicker {ticker:string;latestDataDate:string}
export interface OperationalCatalog {schemaVersion:"operational_market_v1";evidenceStatus:"unreviewed";items:OperationalTicker[];total:number;offset:number;limit:number}
export interface OperationalResult<T>{data:T|null;error:string|null}
export function validCatalog(value:unknown):value is OperationalCatalog {
 if(!value||typeof value!=="object")return false;
 const r=value as Record<string,unknown>;
 if(r.schemaVersion!=="operational_market_v1"||r.evidenceStatus!=="unreviewed"||!Array.isArray(r.items)||!Number.isInteger(r.total)||!Number.isInteger(r.offset)||!Number.isInteger(r.limit))return false;
 const total=r.total as number,offset=r.offset as number,limit=r.limit as number;
 if(total<0||offset<0||limit<1||limit>100||r.items.length>limit||r.items.length>total)return false;
 const tickers=new Set<string>();
 return r.items.every((item:unknown)=>{
  if(!item||typeof item!=="object")return false;
  const t=item as Record<string,unknown>;
  if(typeof t.ticker!=="string"||!/^[0-9A-Z]{6}$/.test(t.ticker)||tickers.has(t.ticker))return false;
  tickers.add(t.ticker);
  return typeof t.latestDataDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(t.latestDataDate)&&!Number.isNaN(Date.parse(t.latestDataDate))&&new Date(t.latestDataDate+"T00:00:00Z").toISOString().slice(0,10)===t.latestDataDate;
 });
}
async function request(url:string,fetcher:typeof fetch):Promise<unknown>{
 const response=await fetcher(url,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error("Operational API returned HTTP "+response.status);
 return response.json();
}
export async function loadOperationalCatalog(apiBaseUrl:string|undefined,offset=0,fetcher:typeof fetch=fetch):Promise<OperationalResult<OperationalCatalog>>{
 if(!apiBaseUrl?.trim())return {data:null,error:"Backend URL is not configured"};
 if(!Number.isInteger(offset)||offset<0||offset>100000)return {data:null,error:"Invalid catalog offset"};
 try{
  const body=await request(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/operational/stocks?offset="+offset+"&limit=25",fetcher);
  if(!validCatalog(body)||body.offset!==offset||body.limit!==25)return {data:null,error:"Operational catalog contract mismatch"};
  return {data:body,error:null};
 }catch(error){return {data:null,error:error instanceof Error?error.message:"Operational catalog unavailable"};}
}
export async function loadOperationalBars(ticker:string,apiBaseUrl:string|undefined,fetcher:typeof fetch=fetch):Promise<OperationalResult<OhlcvSeries>>{
 if(!/^[0-9A-Z]{6}$/.test(ticker))return {data:null,error:"Invalid ticker"};
 if(!apiBaseUrl?.trim())return {data:null,error:"Backend URL is not configured"};
 try{
  const body=await request(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/operational/stocks/"+ticker+"/ohlcv",fetcher);
  if(!isOhlcvSeries(body,ticker))return {data:null,error:"Operational OHLCV contract mismatch"};
  return {data:body,error:null};
 }catch(error){return {data:null,error:error instanceof Error?error.message:"Operational OHLCV unavailable"};}
}
