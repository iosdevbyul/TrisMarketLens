import type { DailyResearchRecord } from "./dailyResearch";

export interface DailyResearchPageSummary {
  displayed: number;
  completed: number;
  pending: number;
  blocked: number;
  failed: number;
  real: number;
  synthetic: number;
  withScore: number;
  directionUp: number;
  directionDown: number;
  directionNeutral: number;
  distinctModels: number;
  observedDates: { date: string; completed: number; unresolved: number }[];
}

/** Page-only descriptive aggregation of the already validated publication. No invented model outcomes. */
export function summarizeDailyResearchPage(records: readonly DailyResearchRecord[]): DailyResearchPageSummary {
  const completed = records.filter((item) => item.status === "completed");
  const dateMap = new Map<string, { date: string; completed: number; unresolved: number }>();
  for (const item of records) {
    const bucket = dateMap.get(item.tradingDate) ?? { date: item.tradingDate, completed: 0, unresolved: 0 };
    if (item.status === "completed") bucket.completed++;
    else bucket.unresolved++;
    dateMap.set(item.tradingDate, bucket);
  }
  return {
    displayed: records.length,
    completed: completed.length,
    pending: records.filter((item) => item.status === "pending").length,
    blocked: records.filter((item) => item.status === "blocked").length,
    failed: records.filter((item) => item.status === "failed").length,
    real: records.filter((item) => item.dataOrigin === "real").length,
    synthetic: records.filter((item) => item.dataOrigin === "synthetic_fixture").length,
    withScore: completed.filter((item) => item.researchScore !== null).length,
    directionUp: completed.filter((item) => item.researchSignal === "up").length,
    directionDown: completed.filter((item) => item.researchSignal === "down").length,
    directionNeutral: completed.filter((item) => item.researchSignal === "neutral").length,
    distinctModels: new Set(records.map((item) => item.modelId + "\u0000" + item.modelVersion)).size,
    observedDates: Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
