import type { ScreenerEntry } from "./screener";

export interface DailyAnalysisSummary {
  date: string;
  records: number;
  securities: number;
  up: number;
  down: number;
  neutral: number;
  verified: number;
  pending: number;
  blocked: number;
  latestAnalyzedAt: string;
}

/** Aggregate only observed data-through dates. Missing days are not zero-activity days. */
export function summarizeAnalysisHistory(entries: readonly ScreenerEntry[]): DailyAnalysisSummary[] {
  const grouped = new Map<string, ScreenerEntry[]>();
  for (const entry of entries) {
    const items = grouped.get(entry.dataThrough) ?? [];
    items.push(entry);
    grouped.set(entry.dataThrough, items);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({
    date,
    records: items.length,
    securities: new Set(items.map(item => item.ticker)).size,
    up: items.filter(item => item.direction === "up").length,
    down: items.filter(item => item.direction === "down").length,
    neutral: items.filter(item => item.direction === "neutral").length,
    verified: items.filter(item => item.validation === "verified").length,
    pending: items.filter(item => item.validation === "pending").length,
    blocked: items.filter(item => item.validation === "blocked").length,
    latestAnalyzedAt: items.reduce((latest, item) => item.analyzedAt > latest ? item.analyzedAt : latest, items[0].analyzedAt),
  }));
}
