export interface SchedulerDiagnostics {
  version: "krx_operations_diagnostics_v1";
  status: "pending_review" | "evidence_review_required" | "expired_sessions" | "preflight_blocked" | "collection_due" | "no_due_sessions";
  schedulerEnabled: boolean;
  lastPersistedTradingDate: string | null;
  storedObservations: number;
  completedSessions: number;
  dueSessions: number;
  expiredSessions: number;
  reservedWithoutVerifiedCompletion: number;
  storedWithoutVerifiedHistory: number;
  oldestDueDate: string | null;
  pendingPhase: string | null;
  storageCapacityReady: boolean | null;
  preflightBlockers: unknown[];
  readyForManualCapture: boolean;
  readyForScheduledCollection: boolean;
  operatorConfirmationStillRequired: true;
  networkRequests: 0;
  schedulerChanged: false;
  paperExecutionEligible: false;
}
export interface SchedulerDiagnosticsResult { data: SchedulerDiagnostics | null; error: string | null; }
const states = ["pending_review","evidence_review_required","expired_sessions","preflight_blocked","collection_due","no_due_sessions"];
function integer(n: unknown): n is number { return Number.isSafeInteger(n) && (n as number) >= 0; }
function date(n: unknown): n is string | null { return n === null || (typeof n === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(n)); }
export function isSchedulerDiagnostics(value: unknown): value is SchedulerDiagnostics {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string,unknown>;
  return d.version === "krx_operations_diagnostics_v1" && states.includes(String(d.status)) &&
    typeof d.schedulerEnabled === "boolean" && date(d.lastPersistedTradingDate) &&
    integer(d.storedObservations) && integer(d.completedSessions) && integer(d.dueSessions) &&
    integer(d.expiredSessions) && integer(d.reservedWithoutVerifiedCompletion) &&
    integer(d.storedWithoutVerifiedHistory) && date(d.oldestDueDate) &&
    (d.pendingPhase === null || typeof d.pendingPhase === "string") &&
    (d.storageCapacityReady === null || typeof d.storageCapacityReady === "boolean") &&
    Array.isArray(d.preflightBlockers) && d.preflightBlockers.length <= 100 &&
    typeof d.readyForManualCapture === "boolean" && typeof d.readyForScheduledCollection === "boolean" &&
    d.operatorConfirmationStillRequired === true && d.networkRequests === 0 &&
    d.schedulerChanged === false && d.paperExecutionEligible === false;
}
export async function loadSchedulerDiagnostics(baseUrl: string | undefined, fetcher: typeof fetch = fetch): Promise<SchedulerDiagnosticsResult> {
  if (!baseUrl?.trim()) return {data:null,error:"KRX diagnostics API base URL is not configured"};
  try {
    const response = await fetcher(baseUrl.trim().replace(/[/]+$/,"") + "/api/v1/operations/krx-scheduler/diagnostics",{
      headers:{Accept:"application/json"}, cache:"no-store", signal:AbortSignal.timeout(5000),
    });
    if (!response.ok) return {data:null,error:response.status===503?"KRX scheduler diagnostics provider is not configured":`KRX diagnostics API returned HTTP ${response.status}`};
    const data: unknown = await response.json();
    if (!isSchedulerDiagnostics(data)) return {data:null,error:"KRX diagnostics API returned an invalid response"};
    return {data,error:null};
  } catch { return {data:null,error:"KRX diagnostics API is unreachable"}; }
}
export async function getSchedulerDiagnostics(): Promise<SchedulerDiagnosticsResult> {
  if (process.env.MARKET_LENS_DATA_SOURCE !== "http") return {data:null,error:"HTTP KRX diagnostics source is not enabled"};
  return loadSchedulerDiagnostics(process.env.DONGHAK_API_BASE_URL);
}
