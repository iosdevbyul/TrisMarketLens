import type {HistoricalResult} from "./HistoricalPortfolioDetailDataSource";

export interface HistoricalTickerPosition {
 position_id:string;
 ticker:string;
 status:string;
 quantity:number;
 realized_net_pnl:string|null;
}
export interface HistoricalTickerEvidence {
 schemaVersion:"published_historical_portfolio_v1";
 researchOnly:true;
 operationalEligible:false;
 executable:false;
 pitVerified:false;
 oosVerified:false;
 investmentSuitabilityVerified:false;
 brokerageEligible:false;
 reportId:string;
 ticker:string;
 modelId:string;
 positions:Record<string,unknown>[];
 realizedNetPnl:string|null;
 valuation:Record<string,unknown>|null;
 unavailable:Record<string,string>;
 timeline:Record<string,unknown>[];
 total:number;
 offset:number;
 limit:number;
}

const HASH=/^[a-f0-9]{64}$/;
const TICKER=/^[0-9A-Z]{6}$/;
const LOOPBACK=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
const MONEY=/^-?\d+(?:\.\d+)?$/;
function object(value:unknown):value is Record<string,unknown>{
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
function validDate(value:unknown):boolean{
 return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+"T00:00:00Z"))&&
 new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
export function isHistoricalTickerEvidence(
 value:unknown,reportId:string,ticker:string,offset:number
):value is HistoricalTickerEvidence{
 if(!object(value)||value.schemaVersion!=="published_historical_portfolio_v1"||
  value.researchOnly!==true||value.operationalEligible!==false||
  value.executable!==false||value.pitVerified!==false||value.oosVerified!==false||
  value.investmentSuitabilityVerified!==false||value.brokerageEligible!==false||
  value.reportId!==reportId||value.ticker!==ticker||
  typeof value.modelId!=="string"||!value.modelId||
  value.offset!==offset||value.limit!==10||
  !Number.isSafeInteger(value.total)||(value.total as number)<0||
  (value.total as number)>100000||!Array.isArray(value.timeline)||
  value.timeline.length>10||value.timeline.length>Math.max(0,(value.total as number)-offset)||
  !Array.isArray(value.positions)||value.positions.length>100000||
  !(value.valuation===null||object(value.valuation))||
  !(value.realizedNetPnl===null||(typeof value.realizedNetPnl==="string"&&MONEY.test(value.realizedNetPnl)))||
  !object(value.unavailable)||!Object.values(value.unavailable).every(x=>typeof x==="string")
 )return false;
 if(value.realizedNetPnl===null&&typeof value.unavailable.realizedNetPnl!=="string")return false;
 return value.positions.every((entry:unknown)=>{
  if(!object(entry)||entry.ticker!==ticker||typeof entry.position_id!=="string"||
   !entry.position_id||typeof entry.status!=="string"||!entry.status)return false;
  return entry.realized_net_pnl===null||entry.realized_net_pnl===undefined||
   (typeof entry.realized_net_pnl==="string"&&MONEY.test(entry.realized_net_pnl));
 })&&value.timeline.every((entry:unknown)=>object(entry)&&entry.ticker===ticker&&validDate(entry.trading_date));
}
export async function loadHistoricalTickerEvidence(
 apiBaseUrl:string|undefined,reportId:string,ticker:string,offset=0,fetcher:typeof fetch=fetch
):Promise<HistoricalResult<HistoricalTickerEvidence>>{
 if(!HASH.test(reportId))return {data:null,error:"Invalid published report ID."};
 if(!TICKER.test(ticker))return {data:null,error:"Invalid portfolio ticker."};
 if(!Number.isInteger(offset)||offset<0||offset>100000)return {data:null,error:"Invalid evidence offset."};
 const base=apiBaseUrl?.trim().replace(/\/+$/,"")??"";
 if(!LOOPBACK.test(base))return {data:null,error:"Historical portfolio evidence requires a local loopback backend."};
 try{
  const url=base+"/api/v1/research/historical-portfolios/"+reportId+"/tickers/"+ticker+
   "?offset="+offset+"&limit=10";
  const response=await fetcher(url,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
  if(!response.ok)return {data:null,error:response.status===404?"Published report or ticker not found.":
   response.status===403?"Local operator access required.":
   response.status===503?"Published archive unavailable or verification failed.":
   "Historical ticker API returned HTTP "+response.status+"."};
  const payload:unknown=await response.json();
  if(!isHistoricalTickerEvidence(payload,reportId,ticker,offset))
   return {data:null,error:"Historical ticker evidence contract mismatch."};
  return {data:payload,error:null};
 }catch{
  return {data:null,error:"Historical ticker evidence API unavailable or invalid JSON."};
 }
}
