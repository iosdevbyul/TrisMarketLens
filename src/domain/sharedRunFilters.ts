export interface SharedRunFilters {query:string;pipeline:string;state:string;evidence:string;sort:string;from:string;to:string;attention:boolean;attentionReason:string|null}
export const defaultRunFilters:SharedRunFilters={query:"",pipeline:"all",state:"all",evidence:"all",sort:"newest",from:"",to:"",attention:false,attentionReason:null};
const choices:Record<string,string[]>={pipeline:["all","Market collection","DART session","DART batch acquisition","other"],state:["all","queued","running","succeeded","failed","blocked","unknown"],evidence:["all","validated","partial","invalid","unavailable","not-recorded","issues"],sort:["newest","oldest","duration-longest","duration-shortest"]};
const validDate=(value:string)=>!value||(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value);
export function parseSharedRunFilters(queryString:string):SharedRunFilters{
 const params=new URLSearchParams(queryString);
 const result={...defaultRunFilters};
 result.query=(params.get("run_query")??"").slice(0,200);
 for(const key of ["pipeline","state","evidence","sort"] as const){const value=params.get("run_"+key);if(value&&choices[key].includes(value))result[key]=value;}
 for(const key of ["from","to"] as const){const value=params.get("run_"+key)??"";result[key]=validDate(value)?value:"";}
 result.attention=params.get("run_attention")==="true";
 const reason=params.get("run_attentionReason");
 result.attentionReason=reason&&["failed","blocked","invalid-evidence","unavailable-evidence"].includes(reason)?reason:null;
 if(result.from&&result.to&&result.from>result.to){result.from="";result.to="";}
 return result;
}
export function serializeSharedRunFilters(existingSearch:string,filters:SharedRunFilters):string{
 const params=new URLSearchParams(existingSearch);
 for(const key of Object.keys(defaultRunFilters) as (keyof SharedRunFilters)[]){
  params.delete("run_"+key);
  if(filters[key]!==defaultRunFilters[key]&&filters[key]!==null)params.set("run_"+key,String(filters[key]));
 }
 return params.toString();
}
