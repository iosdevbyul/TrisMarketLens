export type DiagnosticState = "not_configured" | "healthy" | "unreachable" | "misconfigured" | "available" | "empty" | "error" | "demo" | "disconnected";
export function summarizeBackendDiagnostics(mode:string, health:{status:string}|null):DiagnosticState{
 if(mode!=="http")return "not_configured";
 if(health?.status==="ok")return "healthy";
 return health?.status==="misconfigured"?"misconfigured":"unreachable";
}

export type ReadinessAssessment = "not_configured" | "transport_unavailable" | "needs_review" | "partial_evidence";
export function assessReadiness(mode:string, health:{status:string}|null, statuses:string[], tickerChecked:boolean):ReadinessAssessment{
 if(mode!=="http")return "not_configured";
 if(health?.status!=="ok")return "transport_unavailable";
 // Transport health and successfully parsed responses cannot prove approved data or research readiness.
 if(!tickerChecked||statuses.some(status=>status==="error"||status==="disconnected"||status==="demo"))return "needs_review";
 return "partial_evidence";
}
