import { isPredictionEvaluationSnapshot, type PredictionEvaluationSnapshot } from "../domain/predictionEvaluation";
export type EvaluationMode = "disconnected" | "mock" | "http";
export interface EvaluationResult { source: EvaluationMode; data: PredictionEvaluationSnapshot; error: string | null }
export interface EvaluationOptions { mode?: string; apiBaseUrl?: string; fetcher?: typeof fetch }
export function demoPredictionEvaluations(ticker:string): PredictionEvaluationSnapshot {
  return { ticker, evaluations: [
    { id:"demo-eval-001", analysisId:"demo-analysis-1", ticker, evaluatedAt:null, horizonSessions:5, referenceDate:"2026-10-01", referencePrice:100, evaluationDate:null, evaluationPrice:null, realizedReturn:null, verdict:"pending", policyId:"EXAMPLE-POLICY", explanation:"Demonstration evaluation only; no policy decision has been made." },
    { id:"demo-eval-002", analysisId:"demo-analysis-2", ticker, evaluatedAt:"2026-10-01T18:00:00+09:00", horizonSessions:5, referenceDate:"2026-09-23", referencePrice:101, evaluationDate:"2026-09-30", evaluationPrice:103, realizedReturn:0.01980198, verdict:"inconclusive", policyId:"EXAMPLE-POLICY", explanation:"Demonstration evaluation only; no verified success verdict." }
  ] };
}
export async function loadPredictionEvaluations(ticker:string, { mode="disconnected", apiBaseUrl, fetcher=fetch }:EvaluationOptions={}):Promise<EvaluationResult> {
  const empty:PredictionEvaluationSnapshot={ticker,evaluations:[]};
  if(mode==="disconnected") return {source:"disconnected",data:empty,error:null};
  if(mode==="mock") return {source:"mock",data:demoPredictionEvaluations(ticker),error:null};
  if(mode!=="http") return {source:"disconnected",data:empty,error:"Unsupported evaluation mode"};
  if(!apiBaseUrl?.trim()) return {source:"http",data:empty,error:"Evaluation API base URL not configured"};
  try{
    const response=await fetcher(apiBaseUrl.trim().replace(/\/+$/,"")+"/api/v1/stocks/"+encodeURIComponent(ticker)+"/evaluations",{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
    if(!response.ok) return {source:"http",data:empty,error:`Evaluation API returned HTTP ${response.status}`};
    const payload:unknown=await response.json();
    if(!isPredictionEvaluationSnapshot(payload,ticker)) return {source:"http",data:empty,error:"Evaluation API returned invalid data"};
    return {source:"http",data:payload,error:null};
  }catch {return {source:"http",data:empty,error:"Evaluation API is unreachable"};}
}
export function getPredictionEvaluations(ticker:string):Promise<EvaluationResult>{
  return loadPredictionEvaluations(ticker,{mode:process.env.MARKET_LENS_EVALUATION_SOURCE??"disconnected",apiBaseUrl:process.env.DONGHAK_API_BASE_URL});
}
