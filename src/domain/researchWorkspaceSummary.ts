import type { AIManagementSnapshot } from "../data/AIModelManagementDataSource";
import type { DailyResearchResult } from "../data/DailyResearchDataSource";
import { classifyResearchComparisons } from "./aiResearchComparisonGroups";
import { summarizeDailyResearchPage } from "./dailyResearchPageSummary";
import type { ResearchSourceRow } from "./researchSourceStatus";

export type ResearchWorkspaceSummary = {
  overview: "observed" | "partial" | "demo" | "not_verified";
  selectedModelKey: string | null;
  defaultModelKey: string | null;
  selectionVersion: number | null;
  modelBusy: boolean | null;
  lastAppliedModelKey: string | null;
  comparisonContracts: number | null;
  matchedContracts: number | null;
  unclassifiedComparisons: number | null;
  previewRecords: number | null;
  totalResearchRecords: number | null;
  previewCompleted: number | null;
  previewBlocked: number | null;
  previewFailed: number | null;
  previewPending: number | null;
  previewReal: number | null;
  previewSynthetic: number | null;
  lastTradingDate: string | null;
  previewDistinctModels: number | null;
};

function nonempty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.slice(0, 140) : null;
}
function activeModelKey(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const model = value as Record<string, unknown>;
  return nonempty(model.modelKey) ?? nonempty(model.key) ?? nonempty(model.modelId);
}

/** Observability only: no inferred model success, profitability, health or operator approval. */
export function summarizeResearchWorkspace(
  sources: readonly ResearchSourceRow[],
  management: AIManagementSnapshot,
  daily: DailyResearchResult | null,
): ResearchWorkspaceSummary {
  const states = sources.map((source) => source.status);
  const overview: ResearchWorkspaceSummary["overview"] =
    states.includes("demo") ? "demo"
      : states.some((status) => status === "unavailable" || status === "disconnected") ? "partial"
      : states.includes("available") || states.includes("empty") ? "observed" : "not_verified";
  const active = management.state === "available" ? management.active : null;
  const comparisonPublished = management.state === "available"
    && !management.partialErrors.includes("Research comparisons are currently unavailable.");
  const comparison = comparisonPublished ? classifyResearchComparisons(management.comparisons) : null;
  const series = daily?.source === "http" && !daily.error ? daily.data : null;
  const preview = series ? summarizeDailyResearchPage(series.records) : null;
  return {
    overview,
    selectedModelKey: nonempty(active?.selectedModelKey),
    defaultModelKey: nonempty(active?.defaultModelKey),
    selectionVersion: typeof active?.selectionVersion === "number" && Number.isSafeInteger(active.selectionVersion)
      ? active.selectionVersion : null,
    modelBusy: typeof active?.busy === "boolean" ? active.busy : null,
    lastAppliedModelKey: activeModelKey(active?.lastApplied),
    comparisonContracts: comparison?.comparable.length ?? null,
    matchedContracts: comparison?.comparable.filter((group) => group.runCount > 1).length ?? null,
    unclassifiedComparisons: comparison?.unclassified.length ?? null,
    previewRecords: preview?.displayed ?? null,
    totalResearchRecords: series?.totalRecords ?? null,
    previewCompleted: preview?.completed ?? null,
    previewBlocked: preview?.blocked ?? null,
    previewFailed: preview?.failed ?? null,
    previewPending: preview?.pending ?? null,
    previewReal: preview?.real ?? null,
    previewSynthetic: preview?.synthetic ?? null,
    lastTradingDate: series?.records[0]?.tradingDate ?? null,
    previewDistinctModels: preview?.distinctModels ?? null,
  };
}
