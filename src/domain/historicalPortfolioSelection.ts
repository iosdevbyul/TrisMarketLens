/** URL-only selection: no browser storage and no backend mutation. */
const REPORT_ID=/^[a-f0-9]{64}$/;
const MAX_SELECTED=5;

export function parseHistoricalSelection(raw:unknown):string[]{
 const values=Array.isArray(raw)?raw:typeof raw==="string"?[raw]:[];
 if(values.length>MAX_SELECTED||values.some(x=>typeof x!=="string"||!REPORT_ID.test(x)))return [];
 if(new Set(values).size!==values.length)return [];
 return values;
}
export function addHistoricalSelection(current:readonly string[],candidate:string):string[]{
 if(!REPORT_ID.test(candidate)||current.includes(candidate)||current.length>=MAX_SELECTED)return [...current];
 return [...current,candidate];
}
export function removeHistoricalSelection(current:readonly string[],candidate:string):string[]{
 return current.filter(id=>id!==candidate);
}
export function historicalCatalogHref(offset:number,selected:readonly string[]):string{
 const params=new URLSearchParams();
 if(offset>0)params.set("offset",String(offset));
 for(const id of selected)params.append("id",id);
 const q=params.toString();
 return "/backtesting/portfolios"+(q?"?"+q:"");
}
export function historicalCompareHref(selected:readonly string[]):string|null{
 if(selected.length<2||selected.length>MAX_SELECTED||
  selected.some(id=>!REPORT_ID.test(id))||new Set(selected).size!==selected.length)return null;
 const params=new URLSearchParams();
 for(const id of selected)params.append("id",id);
 return "/backtesting/portfolios/compare?"+params.toString();
}
