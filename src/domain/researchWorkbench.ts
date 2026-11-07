import type {ModelSummary} from "./research";
import type {ScreenerEntry} from "./screener";
import type {StockAnalysisRecord} from "./stockAnalysis";

export type WorkbenchState="available"|"empty"|"unconfigured"|"error"|"demo";
export type ResearchSourceResult<T>={state:WorkbenchState;data:T;error:string|null};
export function researchState(source:"http"|"mock"|"disconnected",error:string|null,count:number):WorkbenchState{
 if(source==="mock")return "demo";
 if(source==="disconnected")return "unconfigured";
 if(error)return "error";
 return count===0?"empty":"available";
}
export function validResearchTicker(ticker:string):boolean{return /^[0-9A-Z]{6}$/.test(ticker);}
export function selectedResearchModel(direction:string):"up"|"down"|null{
 return direction==="up"||direction==="down"?direction:null;
}
export function evidenceForTicker(
 entries:readonly ScreenerEntry[],ticker:string,records:readonly StockAnalysisRecord[]
):{entries:ScreenerEntry[];records:StockAnalysisRecord[];matched:boolean}{
 if(!validResearchTicker(ticker))return {entries:[],records:[],matched:false};
 const selected=entries.filter(item=>item.ticker===ticker);
 const own=records.filter(item=>item.ticker===ticker);
 // The models API publishes direction-qualified model summaries; it does not certify
 // that a ticker's modelId is that global model artifact. No inferred model link.
 return {entries:selected,records:own,matched:selected.some(item=>own.some(
  record=>record.id===item.analysisId&&record.modelId===item.modelId&&
    record.modelVersion===item.modelVersion&&record.direction===item.direction&&
    record.dataThrough===item.dataThrough&&record.validation===item.validation&&
    record.score===item.score
 ))};
}
export function publishedModelStatus(models:readonly ModelSummary[],direction:"up"|"down"){
 return models.find(model=>model.id===direction)??null;
}
