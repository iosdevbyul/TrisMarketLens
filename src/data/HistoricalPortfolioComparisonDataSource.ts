import {isHistoricalPortfolioSummary,type HistoricalPortfolioSummary} from "./HistoricalPortfolioDetailDataSource";

export interface ComparisonValuationBasis{
 timestamp:string|null;
 stage:string|null;
 observedMarkFields:string[]|null;
 policy:null;
 unavailable:Record<string,string>;
}
export interface HistoricalPortfolioComparisonItem extends HistoricalPortfolioSummary{
 tickerCount:number;
 signalEvidenceScopes:string[];
 valuationBasis:ComparisonValuationBasis;
}
export interface HistoricalPortfolioComparability{
 periodsDiffer:boolean;
 valuationTimestampsDiffer:boolean|null;
 observedMarkFieldsDiffer:boolean|null;
 valuationPolicyComparison:"unavailable";
 unavailable:Record<string,string>;
 notices:string[];
}
export interface HistoricalPortfolioComparison{
 schemaVersion:"historical_portfolio_comparison_v1";
 researchOnly:true;
 operationalEligible:false;
 executable:false;
 pitVerified:false;
 oosVerified:false;
 investmentSuitabilityVerified:false;
 brokerageEligible:false;
 items:HistoricalPortfolioComparisonItem[];
 comparability:HistoricalPortfolioComparability;
}
export interface ComparisonResult{
 data:HistoricalPortfolioComparison|null;
 error:string|null;
}

const HASH=/^[a-f0-9]{64}$/;
const LOOPBACK=/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
function record(value:unknown):value is Record<string,unknown>{
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
function unavailableRecord(value:unknown):value is Record<string,string>{
 return record(value)&&Object.values(value).every(entry=>typeof entry==="string");
}
export function validComparisonSelection(ids:unknown):ids is string[]{
 return Array.isArray(ids)&&ids.length>=2&&ids.length<=5&&
  ids.every(id=>typeof id==="string"&&HASH.test(id))&&new Set(ids).size===ids.length;
}
export function validHistoricalComparison(value:unknown,selectedIds:string[]):value is HistoricalPortfolioComparison{
 if(!validComparisonSelection(selectedIds)||!record(value)||
  value.schemaVersion!=="historical_portfolio_comparison_v1"||
  value.researchOnly!==true||value.operationalEligible!==false||value.executable!==false||
  value.pitVerified!==false||value.oosVerified!==false||
  value.investmentSuitabilityVerified!==false||value.brokerageEligible!==false||
  !Array.isArray(value.items)||value.items.length!==selectedIds.length||!record(value.comparability))return false;
 const actual=new Set<string>();
 const allItems=value.items.every((entry:unknown)=>{
  if(!record(entry)||typeof entry.reportId!=="string"||
   !selectedIds.includes(entry.reportId)||actual.has(entry.reportId)||
   !isHistoricalPortfolioSummary(entry,entry.reportId)||entry.tickerCount!==entry.tickers.length||
   !Array.isArray(entry.signalEvidenceScopes)||
   !entry.signalEvidenceScopes.every((scope:unknown)=>typeof scope==="string")||
   !record(entry.valuationBasis))return false;
  const basis=entry.valuationBasis;
  if(!(basis.timestamp===null||typeof basis.timestamp==="string")||
   !(basis.stage===null||typeof basis.stage==="string")||
   !(basis.observedMarkFields===null||(Array.isArray(basis.observedMarkFields)&&basis.observedMarkFields.every((field:unknown)=>typeof field==="string")))||
   basis.policy!==null||!unavailableRecord(basis.unavailable))return false;
  actual.add(entry.reportId);
  return true;
 });
 if(!allItems)return false;
 const details=value.comparability;
 return typeof details.periodsDiffer==="boolean"&&
  (details.valuationTimestampsDiffer===null||typeof details.valuationTimestampsDiffer==="boolean")&&
  (details.observedMarkFieldsDiffer===null||typeof details.observedMarkFieldsDiffer==="boolean")&&
  details.valuationPolicyComparison==="unavailable"&&
  unavailableRecord(details.unavailable)&&Array.isArray(details.notices)&&
  details.notices.every((notice:unknown)=>typeof notice==="string")&&
  details.notices.includes("no_ranking_or_recommendation")&&
  details.notices.includes("valuation_policy_not_in_published_projection");
}
export async function comparePublishedHistoricalPortfolios(
 apiBaseUrl:string|undefined,reportIds:string[],fetcher:typeof fetch=fetch
):Promise<ComparisonResult>{
 if(!validComparisonSelection(reportIds))return {data:null,error:"Choose 2 to 5 distinct published report IDs."};
 const base=apiBaseUrl?.trim().replace(/\/+$/,"")??"";
 if(!LOOPBACK.test(base))return {data:null,error:"Comparison requires a local loopback research backend."};
 try{
  const response=await fetcher(base+"/api/v1/research/historical-portfolios/compare",{
   method:"POST",
   headers:{"Content-Type":"application/json",Accept:"application/json"},
   body:JSON.stringify({reportIds}),
   cache:"no-store",
   signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)return {data:null,error:response.status===403?"Local operator access required.":
   response.status===404?"A selected publication is missing or revoked.":
   response.status===503?"Published archive unavailable or verification failed.":
   "Historical portfolio comparison API returned HTTP "+response.status+"."};
  const payload:unknown=await response.json();
  return validHistoricalComparison(payload,reportIds)
   ?{data:payload,error:null}
   :{data:null,error:"Historical portfolio comparison contract mismatch."};
 }catch{
  return {data:null,error:"Historical portfolio comparison API unavailable or invalid JSON."};
 }
}
