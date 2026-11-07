/** Research navigation is a guide to source evidence, never an inference pipeline. */
export type JourneyStatus="demo"|"unavailable"|"empty"|"observed"|"blocked";
export interface JourneyStage{
 id:"collection"|"identity"|"models"|"analysis"|"validation"|"portfolio"|"operations";
 title:string;
 href:string;
 status:JourneyStatus;
 note:string;
}
export interface JourneyInputs{
 mode:string;
 ticker:string|null;
 source:{
  operational:{count:number|null;error:string|null};
  stocks:{count:number|null;includesTicker:boolean;error:string|null};
  models:{count:number|null;error:string|null};
  analysis:{count:number|null;error:string|null;source:string};
  evidence:{count:number|null;unresolvedSecurities:number|null;error:string|null};
  portfolios:{count:number|null;error:string|null};
  operations:{count:number|null;error:string|null;source:string};
 };
}
const TICKER=/^[0-9A-Z]{6}$/;
export function researchPathTicker(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length>6)return null;
 const normalized=raw.trim().toUpperCase();
 return TICKER.test(normalized)?normalized:null;
}
export function researchPathHref(ticker:string|null):string{
 return ticker&&TICKER.test(ticker)?"/research-path?ticker="+encodeURIComponent(ticker):"/research-path";
}
export function researchWorkbenchHref(ticker:string|null):string{
 return ticker&&TICKER.test(ticker)?"/research-workbench?ticker="+encodeURIComponent(ticker):"/research-workbench";
}
function stageState(mode:string,count:number|null,error:string|null,blocked=false):JourneyStatus{
 if(mode!=="http")return "demo";
 if(error||count===null)return "unavailable";
 if(blocked)return "blocked";
 return count===0?"empty":"observed";
}
export function buildResearchPath(inputs:JourneyInputs):JourneyStage[]{
 const {mode,ticker,source:s}=inputs;
 const selected=ticker&&TICKER.test(ticker)?ticker:null;
 const marketState=stageState(mode,s.operational.count,s.operational.error);
 const identityState=stageState(mode,s.stocks.count,s.stocks.error);
 const modelState=stageState(mode,s.models.count,s.models.error);
 const publicationState=s.analysis.source==="http"?
  stageState(mode,s.analysis.count,s.analysis.error):mode==="http"?"unavailable":"demo";
 const evidenceState=stageState(mode,s.evidence.count,s.evidence.error,
  (s.evidence.unresolvedSecurities??0)>0);
 const portfolioState=stageState(mode,s.portfolios.count,s.portfolios.error);
 const operationsState=s.operations.source==="http"?
  stageState(mode,s.operations.count,s.operations.error):mode==="http"?"unavailable":"demo";
 return [
  {id:"collection",title:"Recorded market observations",href:"/operational-market",
   status:marketState,note:"A separate unreviewed KRX snapshot, not approved research market coverage."},
  {id:"identity",title:"Research universe and security identity",
   href:selected&&s.stocks.includesTicker?"/stocks/"+selected:"/stocks",
   status:identityState,note:selected?
    s.stocks.includesTicker?"Selected ticker exists in the returned research universe; historical identity may still be unresolved.":
    "Selected ticker was not confirmed in the research universe. Browse the source catalog before interpreting it.":
    "Choose a ticker from the research universe. Current ticker identity does not establish historical continuity."},
  {id:"models",title:"Frozen model qualification",href:"/models",
   status:modelState,note:"Global directional validation/OOS metrics do not certify per-ticker predictions or trading eligibility."},
  {id:"analysis",title:"Explicitly published per-ticker analysis",
   href:researchWorkbenchHref(selected),status:publicationState,
   note:selected?"Inspect the actual ticker publication and match its source evidence; no score is inferred from a global model.":
    "Select a ticker to trace a published analysis. Empty or unavailable is not a neutral prediction."},
  {id:"validation",title:"Research evidence and unresolved blockers",href:"/evidence",
   status:evidenceState,note:"Coverage, settlement and corporate-action blockers must be checked; observation counts do not clear them."},
  {id:"portfolio",title:"Pinned historical portfolio research",href:"/backtesting/portfolios",
   status:portfolioState,note:"Only operator-pinned historical research reports, never brokerage trades, verified PIT/OOS, or an inferred live return."},
  {id:"operations",title:"Acquisition and publication operations",href:"/operations/trace",
   status:operationsState,note:"Recorded pipeline outcomes are not semantic approval. Inspect errors, missing evidence and scheduling separately."}
 ];
}
export function journeyHasUnsupportedApprovalClaim(stages:readonly JourneyStage[]):boolean{
 // All observed statuses here mean only that a source responded with records.
 return stages.some(stage=>!["demo","unavailable","empty","observed","blocked"].includes(stage.status));
}
