import {loadOperationalCatalog,type OperationalTicker,type OperationalResult} from "./OperationalMarketDataSource";

export interface DateDistribution {
  observedTickers:number;
  latestDates:{date:string;count:number}[];
  newestDate:string|null;
  oldestDate:string|null;
  complete:true;
}
const MAX_TICKERS=2500;
export async function loadOperationalDateDistribution(baseUrl:string|undefined,fetcher:typeof fetch=fetch):Promise<OperationalResult<DateDistribution>>{
 const first=await loadOperationalCatalog(baseUrl,0,fetcher);
 if(!first.data)return {data:null,error:first.error};
 const total=first.data.total;
 if(total>MAX_TICKERS)return {data:null,error:"Full catalog exceeds safe request limit; distribution not calculated."};
 const items:OperationalTicker[]=[...first.data.items];
 const seen=new Set(items.map(item=>item.ticker));
 for(let offset=25;offset<total;offset+=25){
   const result=await loadOperationalCatalog(baseUrl,offset,fetcher);
   if(!result.data)return {data:null,error:"Catalog page "+offset+" unavailable: "+result.error};
   if(result.data.total!==total||result.data.items.length!==Math.min(25,total-offset))
     return {data:null,error:"Catalog changed during pagination; distribution not calculated."};
   for(const item of result.data.items){
     if(seen.has(item.ticker))return {data:null,error:"Duplicate ticker across catalog pages; distribution not calculated."};
     seen.add(item.ticker);items.push(item);
   }
 }
 if(items.length!==total)return {data:null,error:"Incomplete catalog; distribution not calculated."};
 const counts=new Map<string,number>();
 for(const item of items)counts.set(item.latestDataDate,(counts.get(item.latestDataDate)??0)+1);
 const latestDates=[...counts].sort(([a],[b])=>b.localeCompare(a)).map(([date,count])=>({date,count}));
 return {data:{observedTickers:total,latestDates,newestDate:latestDates[0]?.date??null,oldestDate:latestDates.at(-1)?.date??null,complete:true},error:null};
}
