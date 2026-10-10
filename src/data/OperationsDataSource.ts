import { disconnectedOperations, validateOperationsSnapshot, type OperationsSnapshot } from "@/domain/operations";

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
    if (!["queued", "running", "succeeded", "failed", "blocked"].includes(String(run.state))) return false;
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
    const response = await fetcher(apiBaseUrl.trim().replace(/\/+$/, "") + "/api/v1/operations", {
      headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return unavailable("http", `Operations API returned HTTP ${response.status}`);
    const body: unknown = await response.json();
    if (!isValidSnapshot(body)) return unavailable("http", "Operations API returned an invalid snapshot");
    return { source: "http", snapshot: body, error: null };
  } catch {
    return unavailable("http", "Operations API is unreachable");
  }
}
export function getOperations(): Promise<OperationsResult> {
  return loadOperations({ mode: process.env.MARKET_LENS_OPERATIONS_SOURCE ?? "disconnected", apiBaseUrl: process.env.DONGHAK_API_BASE_URL });
}
