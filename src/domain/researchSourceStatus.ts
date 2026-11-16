import type { BackendHealth } from "../data/backendHealth";
import type { DailyResearchResult } from "../data/DailyResearchDataSource";
import type { AIManagementSnapshot } from "../data/AIModelManagementDataSource";

export type ResearchSourceStatus = "available" | "empty" | "disconnected" | "unavailable" | "demo" | "not_checked";
export interface ResearchSourceRow {
  id: string;
  name: string;
  status: ResearchSourceStatus;
  detail: string;
  href: string;
  count: number | null;
}

export interface ResearchStatusInput {
  sourceMode: string;
  health: BackendHealth | null;
  management: Pick<AIManagementSnapshot, "state" | "models" | "comparisons" | "partialErrors">;
  daily: DailyResearchResult | null;
  ticker: string | null;
}

/** Each status is independent: network health never certifies publication quality. */
export function researchSourceRows(input: ResearchStatusInput): ResearchSourceRow[] {
  const { sourceMode, health, management, daily, ticker } = input;
  const isHttp = sourceMode === "http";
  const backend: ResearchSourceRow = {
    id: "backend", name: "Read-only market API", href: "/diagnostics",
    status: !isHttp ? sourceMode === "mock" ? "demo" : "disconnected" : health?.status === "ok" ? "available" : "unavailable",
    count: null,
    detail: !isHttp ? "Market HTTP mode is not enabled. A demo source is not an actual research publication."
      : health?.status === "ok" ? "Backend health responded. Individual publications still require independent checks."
      : "Backend health is unverified, misconfigured, or unreachable.",
  };
  const model: ResearchSourceRow = {
    id: "model", name: "Research LLM management", href: "/ai-research-models",
    status: management.state === "available" ? management.models.length ? "available" : "empty"
      : management.state === "unconfigured" ? "disconnected" : "unavailable",
    count: management.state === "available" ? management.models.length : null,
    detail: management.state === "available"
      ? "Authenticated model catalog observed. Registration does not imply model execution or approved investment predictions."
      : "Authenticated research LLM management is unavailable or not configured.",
  };
  const comparisonAvailable = management.state === "available"
    && !management.partialErrors.includes("Research comparisons are currently unavailable.");
  const comparison: ResearchSourceRow = {
    id: "comparison", name: "Managed research comparisons", href: "/ai-research-models",
    status: comparisonAvailable ? management.comparisons.length ? "available" : "empty"
      : management.state === "unconfigured" ? "disconnected" : "unavailable",
    count: comparisonAvailable ? management.comparisons.length : null,
    detail: comparisonAvailable
      ? "Retained runs must share the same backend comparison contract before matched inspection."
      : "Comparison publication is not available from the authenticated management endpoint.",
  };
  const dailyState: ResearchSourceStatus = !ticker ? "not_checked" : !daily || daily.source === "disconnected"
    ? "disconnected" : daily.error || !daily.data ? "unavailable"
      : daily.data.records.length ? "available" : "empty";
  const dailyRow: ResearchSourceRow = {
    id: "daily", name: "Per-ticker daily research", href: ticker ? "/stocks/" + ticker + "#daily-research" : "/stocks",
    status: dailyState,
    count: daily?.data ? daily.data.totalRecords : null,
    detail: !ticker ? "Choose a six-character ticker to check the independently published research series."
      : dailyState === "available" || dailyState === "empty"
        ? "Validated research publication for " + ticker + ". Completion is not a verified price forecast."
        : "Daily research is disconnected or unavailable for " + ticker + "; no demonstration fallback was used.",
  };
  return [backend, model, comparison, dailyRow];
}
