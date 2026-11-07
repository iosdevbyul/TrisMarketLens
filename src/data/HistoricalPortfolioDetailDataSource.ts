import type {PublishedPortfolio} from "./HistoricalPortfolioDataSource";

export interface HistoricalPortfolioSummary extends PublishedPortfolio {
 schemaVersion:"published_historical_portfolio_v1";
 researchOnly:true;
 operationalEligible:false;
 executable:false;
 pitVerified:false;
 oosVerified:false;
 investmentSuitabilityVerified:false;
 brokerageEligible:false;
 resultSchemaVersion:"five_ticker_historical_result_v1";
 reportSchemaVersion:"five_ticker_historical_report_v1";
 modelId:string;
 finalTotalCash:string;
 availableCash:string;
 reservedCash:string;
 finalPortfolioEquity:string|null;
 realizedNetPnl:string;
 unrealizedPnl:string|null;
 portfolioReturn:string|null;
 decisionCount:number;
 acceptedOrderCount:number;
 fillCount:number;
 completedPositionCount:number;
 pendingOrderCount:number;
 dataOrigin:string;
 limitations:string[];
 unavailable:Record<string,string>;
}
export interface HistoricalTradesPage {
 schemaVersion:"published_historical_portfolio_v1";
 researchOnly:true;
 operationalEligible:false;
 executable:false;
 pitVerified:false;
 oosVerified:false;
 investmentSuitabilityVerified:false;
 brokerageEligible:false;
 reportId:string;
 items:Record<string,unknown>[];
 total:number;
 offset:number;
 limit:number;
}
export interface HistoricalResult<T> {data:T|null;error:string|null}
const HASH=/^[a-f0-9]{64}$/;
const BASE=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
const NUM=/^-?\d+(?:\.\d+)?$/;
function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value);}
function envelope(v:Record<string,unknown>):boolean{
 return v.schemaVersion==="published_historical_portfolio_v1"&&v.researchOnly===true&&
 v.operationalEligible===false&&v.executable===false&&v.pitVerified===false&&v.oosVerified===false&&
 v.investmentSuitabilityVerified===false&&v.brokerageEligible===false;
}
function money(v:unknown,nullable=false):boolean{return (nullable&&v===null)||(typeof v==="string"&&NUM.test(v));}
function count(v:unknown):boolean{return Number.isSafeInteger(v)&&(v as number)>=0;}
export function isHistoricalPortfolioSummary(v:unknown,reportId:string):v is HistoricalPortfolioSummary{
 if(!object(v)||!envelope(v)||v.reportId!==reportId||!HASH.test(reportId)||
  v.resultSchemaVersion!=="five_ticker_historical_result_v1"||
  v.reportSchemaVersion!=="five_ticker_historical_report_v1"||
  !(v.modelFamily==="linear"||v.modelFamily==="hgb")||
  typeof v.modelId!=="string"||!v.modelId||
  typeof v.publishedAt!=="string"||!Number.isFinite(Date.parse(v.publishedAt))||
  !Array.isArray(v.tickers)||v.tickers.length!==5||
  !v.tickers.every((t:unknown)=>typeof t==="string"&&/^[0-9A-Z]{6}$/.test(t))||
  new Set(v.tickers).size!==5||!object(v.period)||typeof v.evidenceScope!=="string"||
  typeof v.dataOrigin!=="string"||typeof v.portfolioValuationAvailable!=="boolean"||
  v.archiveVerification!=="integrity_verified"||
  v.reportVerification!=="offline_authoritative_replay_passed")return false;
 for(const key of ["initialVirtualCash","finalTotalCash","availableCash","reservedCash","realizedNetPnl"])
  if(!money(v[key]))return false;
 for(const key of ["finalPortfolioEquity","unrealizedPnl","portfolioReturn"])
  if(!money(v[key],true))return false;
 for(const key of ["decisionCount","acceptedOrderCount","fillCount","completedPositionCount","pendingOrderCount"])
  if(!count(v[key]))return false;
 return Array.isArray(v.limitations)&&v.limitations.every((s:unknown)=>typeof s==="string")&&
  object(v.unavailable)&&Object.values(v.unavailable).every(s=>typeof s==="string");
}
export function isHistoricalTradesPage(v:unknown,reportId:string,offset:number):v is HistoricalTradesPage{
 if(!object(v)||!envelope(v)||v.reportId!==reportId||v.offset!==offset||v.limit!==10||
  !count(v.total)||(v.total as number)>100000||!Array.isArray(v.items)||
  v.items.length>10||v.items.length>Math.max(0,(v.total as number)-offset))return false;
 // Backend trade evidence is nested and versioned independently. Do not interpret it as broker executions.
 return v.items.every((row:unknown)=>object(row));
}
async function request<T>(base:string,path:string,validate:(v:unknown)=>v is T,fetcher:typeof fetch):Promise<HistoricalResult<T>>{
 try{
  const response=await fetcher(base+path,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok){
   return {data:null,error:response.status===403?"Local operator access required.":
    response.status===404?"Published report not found or revoked.":
    response.status===503?"Published archive unavailable or verification failed.":
    "Historical portfolio API returned HTTP "+response.status+"."};
  }
  const value:unknown=await response.json();
  return validate(value)?{data:value,error:null}:{data:null,error:"Historical portfolio response contract mismatch."};
 }catch{
  return {data:null,error:"Historical portfolio API unavailable or returned invalid JSON."};
 }
}
function validateArgs(baseUrl:string|undefined,id:string):string|null{
 const base=baseUrl?.trim().replace(/\/+$/,"")??"";
 return !HASH.test(id)?"Invalid report ID.":!BASE.test(base)?"Historical portfolio access requires a loopback backend.":null;
}
export async function loadHistoricalPortfolioSummary(
 baseUrl:string|undefined,reportId:string,fetcher:typeof fetch=fetch
):Promise<HistoricalResult<HistoricalPortfolioSummary>>{
 const error=validateArgs(baseUrl,reportId);
 if(error)return {data:null,error};
 const base=baseUrl!.trim().replace(/\/+$/,"");
 return request(base,"/api/v1/research/historical-portfolios/"+reportId,
  (v):v is HistoricalPortfolioSummary=>isHistoricalPortfolioSummary(v,reportId),fetcher);
}
export async function loadHistoricalPortfolioTrades(
 baseUrl:string|undefined,reportId:string,offset=0,fetcher:typeof fetch=fetch
):Promise<HistoricalResult<HistoricalTradesPage>>{
 const error=validateArgs(baseUrl,reportId);
 if(error)return {data:null,error};
 if(!Number.isInteger(offset)||offset<0||offset>100000)return {data:null,error:"Invalid trade offset."};
 const base=baseUrl!.trim().replace(/\/+$/,"");
 return request(base,"/api/v1/research/historical-portfolios/"+reportId+"/trades?offset="+offset+"&limit=10",
  (v):v is HistoricalTradesPage=>isHistoricalTradesPage(v,reportId,offset),fetcher);
}
