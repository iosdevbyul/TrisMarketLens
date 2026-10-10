export type AnalysisRunState = "queued" | "running" | "succeeded" | "failed" | "blocked";
export type OperationsConnectionState = "not_connected" | "connected" | "degraded";
export interface AnalysisRun {
  id: string;
  pipeline: string;
  state: AnalysisRunState;
  startedAt: string | null;
  finishedAt: string | null;
  dataThrough: string | null;
  summary: string | null;
}
export interface OperationsSnapshot {
  connection: OperationsConnectionState;
  checkedAt: string | null;
  latestDataThrough: string | null;
  nextScheduledRun: string | null;
  runs: AnalysisRun[];
}
/** Safe, explicit empty state. Never represent missing backend data as a successful run. */
export const disconnectedOperations: OperationsSnapshot = {
  connection: "not_connected",
  checkedAt: null,
  latestDataThrough: null,
  nextScheduledRun: null,
  runs: [],
};
export function validateOperationsSnapshot(value: OperationsSnapshot): boolean {
  if (!["not_connected", "connected", "degraded"].includes(value.connection)) return false;
  const ids = new Set<string>();
  return value.runs.every(run => {
    if (!run.id || ids.has(run.id) || !["queued","running","succeeded","failed","blocked"].includes(run.state)) return false;
    ids.add(run.id);
    if (run.startedAt !== null && !Number.isFinite(Date.parse(run.startedAt))) return false;
    if (run.finishedAt !== null && !Number.isFinite(Date.parse(run.finishedAt))) return false;
    return true;
  });
}
