/** DonghakStockVision's pinned, local-only historical portfolio publication API. */
export interface PublishedPortfolio {
 reportId:string;
 modelFamily:"linear"|"hgb";
 tickers:string[];
 publishedAt:string;
 initialVirtualCash:string;
 period:Record<string,string>;
 evidenceScope:string;
 portfolioValuationAvailable:boolean;
 archiveVerification:"integrity_verified";
 reportVerification:"offline_authoritative_replay_passed";
}
export interface PublishedPortfolioPage {
 schemaVersion:"published_historical_portfolio_v1";
 researchOnly:true;
 operationalEligible:false;
 executable:false;
 pitVerified:false;
 oosVerified:false;
 investmentSuitabilityVerified:false;
 brokerageEligible:false;
 items:PublishedPortfolio[];
 total:number;
 offset:number;
 limit:number;
}
export interface PublishedPortfoliosResult {
 data:PublishedPortfolioPage|null;
 error:string|null;
 unavailable:boolean;
}
const HASH=/^[a-f0-9]{64}$/;
const LOOPBACK=/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
function record(value:unknown):value is Record<string,unknown> {
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
function restrictions(value:Record<string,unknown>):boolean{
 return value.researchOnly===true&&value.operationalEligible===false&&
  value.executable===false&&value.pitVerified===false&&value.oosVerified===false&&
  value.investmentSuitabilityVerified===false&&value.brokerageEligible===false;
}
function itemValid(value:unknown):value is PublishedPortfolio{
 if(!record(value)||!restrictions(value))return false;
 const tickers=value.tickers;
 return typeof value.reportId==="string"&&HASH.test(value.reportId)&&
  (value.modelFamily==="linear"||value.modelFamily==="hgb")&&
  Array.isArray(tickers)&&tickers.length===5&&new Set(tickers).size===5&&
  tickers.every(t=>typeof t==="string"&&/^[0-9A-Z]{6}$/.test(t))&&
  typeof value.publishedAt==="string"&&!Number.isNaN(Date.parse(value.publishedAt))&&
  typeof value.initialVirtualCash==="string"&&/^\d+(?:\.\d+)?$/.test(value.initialVirtualCash)&&
  record(value.period)&&Object.values(value.period).every(v=>typeof v==="string")&&
  typeof value.evidenceScope==="string"&&
  typeof value.portfolioValuationAvailable==="boolean"&&
  value.archiveVerification==="integrity_verified"&&
  value.reportVerification==="offline_authoritative_replay_passed";
}
export function isPublishedPortfolioPage(value:unknown,offset:number,limit:number):value is PublishedPortfolioPage{
 if(!record(value)||value.schemaVersion!=="published_historical_portfolio_v1"||!restrictions(value))return false;
 if(value.offset!==offset||value.limit!==limit||!Number.isSafeInteger(value.total)||
  (value.total as number)<0||(value.total as number)>128||!Array.isArray(value.items)||
  value.items.length>limit||value.items.length>Math.max(0,(value.total as number)-offset))return false;
 const seen=new Set<string>();
 return value.items.every(item=>itemValid(item)&&!seen.has(item.reportId)&&!!seen.add(item.reportId));
}
export async function loadPublishedPortfolios(
 apiBaseUrl:string|undefined,offset=0,fetcher:typeof fetch=fetch
):Promise<PublishedPortfoliosResult>{
 // This archive endpoint is restricted to the local operator. No remote deployment fallback.
 const base=apiBaseUrl?.trim().replace(/\/+$/,"")??"";
 if(!LOOPBACK.test(base))return {data:null,error:"Historical publications require a local loopback backend.",unavailable:true};
 if(!Number.isInteger(offset)||offset<0||offset>100000)return {data:null,error:"Invalid publication offset.",unavailable:true};
 const limit=10;
 try{
  const response=await fetcher(base+"/api/v1/research/historical-portfolios?offset="+offset+"&limit="+limit,{
   headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)
  });
  if(!response.ok){
   const error=response.status===503?"Historical publication archive is not configured or unavailable.":
    response.status===403?"Historical publications require local operator access.":
    "Historical publication API returned HTTP "+response.status+".";
   return {data:null,error,unavailable:true};
  }
  const payload:unknown=await response.json();
  if(!isPublishedPortfolioPage(payload,offset,limit))
   return {data:null,error:"Historical portfolio publication contract mismatch.",unavailable:true};
  return {data:payload,error:null,unavailable:false};
 }catch{
  return {data:null,error:"Historical publication API is unreachable or returned invalid JSON.",unavailable:true};
 }
}
