import type {ReadinessAssessment} from "./backendDiagnostics";
export interface Remediation {id:string;title:string;detail:string}
export function diagnosticRemediations(readiness:ReadinessAssessment, states:{name:string;state:string}[], tickerChecked:boolean):Remediation[]{
 const steps:Remediation[]=[];
 if(readiness==="not_configured")steps.push({id:"configure",title:"Configure HTTP mode",detail:"Set MARKET_LENS_DATA_SOURCE=http and DONGHAK_API_BASE_URL, then restart the web server."});
 if(readiness==="transport_unavailable")steps.push({id:"transport",title:"Restore backend transport",detail:"Start DonghakStockVision locally and verify its read-only /api/v1/health response."});
 if(readiness!=="not_configured"&&readiness!=="transport_unavailable"){
  if(!tickerChecked)steps.push({id:"ticker",title:"Select a ticker",detail:"Run ticker diagnostics using a supported six-character ticker."});
  for(const item of states){
   if(item.state==="error"||item.state==="disconnected"||item.state==="demo")steps.push({id:"source-"+item.name,title:"Review "+item.name,detail:item.state==="error"?"Investigate the API response and backend publication configuration.":item.state==="demo"?"Use an approved HTTP publication, not fictional demonstration data.":"Enable the reviewed data source or document that it is intentionally unavailable."});
  }
  steps.push({id:"integrity",title:"Verify research evidence independently",detail:"Confirm immutable market DB fingerprints, publication provenance and authorized local HTTP E2E checks. An HTTP success is not research approval."});
 }
 return steps;
}
