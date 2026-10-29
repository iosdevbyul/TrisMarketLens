export type DiagnosticState = "not_configured" | "healthy" | "unreachable" | "misconfigured" | "available" | "empty" | "error" | "demo" | "disconnected";
export function summarizeBackendDiagnostics(mode:string, health:{status:string}|null):DiagnosticState{
 if(mode!=="http")return "not_configured";
 if(health?.status==="ok")return "healthy";
 return health?.status==="misconfigured"?"misconfigured":"unreachable";
}
