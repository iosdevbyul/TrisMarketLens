import { resolveFeatureSourceMode } from "./resolveFeatureSourceMode";
import { disconnectedOperations, validateOperationsSnapshot, type OperationsSnapshot } from "../domain/operations";

export type OperationsSourceMode = "disconnected" | "mock" | "http";
export interface OperationsSourceOptions {
  mode?: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
}
export interface OperationsResult {
  source: OperationsSourceMode;
  snapshot: OperationsSnapshot;
  error: string | null;
}

export const demonstrationOperations: OperationsSnapshot = {
  connection: "connected",
  checkedAt: "2026-10-01T18:30:00+09:00",
  latestDataThrough: "2026-10-01",
  nextScheduledRun: "2026-10-02T18:30:00+09:00",
  runs: [
    { id: "demo-002", pipeline: "Daily market validation", state: "succeeded", startedAt: "2026-10-01T18:30:00+09:00", finishedAt: "2026-10-01T18:33:00+09:00", dataThrough: "2026-10-01", summary: "Demonstration data only" },
    { id: "demo-001", pipeline: "Model inference", state: "blocked", startedAt: "2026-10-01T18:34:00+09:00", finishedAt: null, dataThrough: null, summary: "Demonstration data only" },
  ],
};

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
}
function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}
type EvidenceStatus = "validated" | "partial" | "invalid" | "unavailable";
interface BackendRun { id: string; operationType: "dart_batch_acquisition" | "dart_session" | "market_ingestion"; startedAt: string | null; completedAt: string | null; executionStatus: "completed" | "incomplete" | "failed" | "interrupted" | "not_started"; evidenceStatus: EvidenceStatus; recordCount: number | null; sourceType: "dart_ledger" | "sqlite_collection_audit"; semanticApproval: false; blockingStatus: "blocked" | "unknown" | null; diagnostic: string | null }
interface RunsPayload { schemaVersion: "operations_v1"; items: BackendRun[]; total: number; offset: number; limit: number; evidenceStatus: EvidenceStatus; diagnostic: string | null }
function isNullableTimestamp(v: unknown): boolean { return v === null || isTimestamp(v); }
function isBackendPayload(value: unknown): value is RunsPayload {
 if (!value || typeof value !== "object") return false;
 const p = value as Record<string, unknown>;
 const evidence = ["validated","partial","invalid","unavailable"];
 if (p.schemaVersion !== "operations_v1" || !Array.isArray(p.items) || p.items.length > 100 ||
     !Number.isInteger(p.total) || (p.total as number) < 0 || !Number.isInteger(p.offset) || p.offset !== 0 ||
     !Number.isInteger(p.limit) || p.limit !== 25 || p.items.length > (p.limit as number) ||
     !evidence.includes(String(p.evidenceStatus)) || (p.diagnostic !== null && typeof p.diagnostic !== "string")) return false;
 if ((p.total as number) < p.items.length) return false;
 const ids = new Set<string>();
 return p.items.every((candidate: unknown) => {
  if (!candidate || typeof candidate !== "object") return false;
  const r = candidate as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id || ids.has(r.id)) return false;
  ids.add(r.id);
  return ["dart_batch_acquisition","dart_session","market_ingestion"].includes(String(r.operationType)) &&
   ["completed","incomplete","failed","interrupted","not_started"].includes(String(r.executionStatus)) &&
   evidence.includes(String(r.evidenceStatus)) &&
   ["dart_ledger","sqlite_collection_audit"].includes(String(r.sourceType)) &&
   r.semanticApproval === false && isNullableTimestamp(r.startedAt) && isNullableTimestamp(r.completedAt) &&
   (r.recordCount === null || (Number.isInteger(r.recordCount) && (r.recordCount as number) >= 0)) &&
   (r.blockingStatus === null || ["blocked","unknown"].includes(String(r.blockingStatus))) &&
   (r.diagnostic === null || typeof r.diagnostic === "string");
 });
}
function adaptBackendPayload(payload: RunsPayload): OperationsSnapshot {
 return {
  connection: payload.evidenceStatus === "invalid" ? "degraded" : "connected",
  checkedAt: null, latestDataThrough: null, nextScheduledRun: null,
  runs: payload.items.map(run => ({
   id: run.id,
   pipeline: run.operationType === "market_ingestion" ? "Market collection" : run.operationType === "dart_session" ? "DART session" : "DART batch acquisition",
   // Completion proves only that an execution outcome was recorded; it does not prove semantic success.
   state: run.executionStatus === "failed" ? "failed" : run.blockingStatus === "blocked" ? "blocked" : "unknown",
   startedAt: run.startedAt, finishedAt: run.completedAt, dataThrough: null,
   summary: [`Recorded status: ${run.executionStatus}`, `Evidence: ${run.evidenceStatus}`, `Source: ${run.sourceType}`, run.recordCount === null ? "Recorded rows: unavailable" : `Recorded rows: ${run.recordCount}`, "Semantic approval: not granted", run.diagnostic].filter(Boolean).join(" · "),
  })),
 };
}
function isValidSnapshot(value: unknown): value is OperationsSnapshot {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (!["not_connected", "connected", "degraded"].includes(String(record.connection))) return false;
  if (record.checkedAt !== null && !isTimestamp(record.checkedAt)) return false;
  if (record.latestDataThrough !== null && !isIsoDate(record.latestDataThrough)) return false;
  if (record.nextScheduledRun !== null && !isTimestamp(record.nextScheduledRun)) return false;
  if (!Array.isArray(record.runs) || record.runs.length > 1000) return false;
  for (const candidate of record.runs) {
    if (!candidate || typeof candidate !== "object") return false;
    const run = candidate as Record<string, unknown>;
    if (typeof run.id !== "string" || typeof run.pipeline !== "string" || !run.pipeline) return false;
    if (!["queued", "running", "succeeded", "failed", "blocked", "unknown"].includes(String(run.state))) return false;
    if (run.startedAt !== null && !isTimestamp(run.startedAt)) return false;
    if (run.finishedAt !== null && !isTimestamp(run.finishedAt)) return false;
    if (run.dataThrough !== null && !isIsoDate(run.dataThrough)) return false;
    if (run.summary !== null && typeof run.summary !== "string") return false;
  }
  return validateOperationsSnapshot(value as OperationsSnapshot);
}
const unavailable = (source: OperationsSourceMode, error: string): OperationsResult => ({
  source, snapshot: { ...disconnectedOperations, connection: "degraded" }, error,
});
export async function loadOperations({ mode = "disconnected", apiBaseUrl, fetcher = fetch }: OperationsSourceOptions = {}): Promise<OperationsResult> {
  if (mode === "disconnected") return { source: "disconnected", snapshot: disconnectedOperations, error: null };
  if (mode === "mock") return { source: "mock", snapshot: demonstrationOperations, error: null };
  if (mode !== "http") return unavailable("disconnected", "Unsupported operations mode");
  if (!apiBaseUrl?.trim()) return unavailable("http", "Operations API base URL is not configured");
  try {
    const response = await fetcher(apiBaseUrl.trim().replace(/\/+$/, "") + "/api/v1/operations/runs?offset=0&limit=25", {
      headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return unavailable("http", `Operations API returned HTTP ${response.status}`);
    const body: unknown = await response.json();
    if (!isBackendPayload(body)) return unavailable("http", "Operations API returned an invalid operations_v1 payload");
    const snapshot = adaptBackendPayload(body);
    if (!isValidSnapshot(snapshot)) return unavailable("http", "Operations API returned an invalid snapshot");
    return { source: "http", snapshot, error: null };
  } catch {
    return unavailable("http", "Operations API is unreachable");
  }
}
export function getOperations(): Promise<OperationsResult> {
  return loadOperations({ mode: resolveFeatureSourceMode(process.env.MARKET_LENS_OPERATIONS_SOURCE, process.env.MARKET_LENS_DATA_SOURCE), apiBaseUrl: process.env.DONGHAK_API_BASE_URL });
}
