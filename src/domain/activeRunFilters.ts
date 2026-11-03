import {defaultRunFilters,type SharedRunFilters} from "./sharedRunFilters";
export type ActiveRunFilter={key:keyof SharedRunFilters;label:string};
export function getActiveRunFilters(filters:SharedRunFilters):ActiveRunFilter[]{
 const entries:ActiveRunFilter[]=[];
 if(filters.query.trim())entries.push({key:"query",label:"Search: "+filters.query});
 if(filters.pipeline!=="all")entries.push({key:"pipeline",label:"Pipeline: "+filters.pipeline});
 if(filters.state!=="all")entries.push({key:"state",label:"Status: "+filters.state});
 if(filters.evidence!=="all")entries.push({key:"evidence",label:"Evidence: "+filters.evidence});
 if(filters.from)entries.push({key:"from",label:"From (UTC): "+filters.from});
 if(filters.to)entries.push({key:"to",label:"To (UTC): "+filters.to});
 if(filters.attention)entries.push({key:"attention",label:"Needs attention only"});
 if(filters.attentionReason)entries.push({key:"attentionReason",label:"Attention reason: "+filters.attentionReason.replaceAll("-"," ")});
 if(filters.sort!==defaultRunFilters.sort)entries.push({key:"sort",label:"Sort: "+filters.sort.replaceAll("-"," ")});
 return entries;
}
