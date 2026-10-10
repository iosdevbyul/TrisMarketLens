import type { ScreenerEntry } from "./screener";

export interface AnalysisOverview {
  analysisCount: number;
  securityCount: number;
  direction: { up: number; down: number; neutral: number };
  validation: { verified: number; pending: number; blocked: number };
  latestDataThrough: string | null;
  latestAnalyzedAt: string | null;
  verifiedRate: number | null;
}
export function summarizeAnalyses(entries: readonly ScreenerEntry[]): AnalysisOverview {
  const direction = { up: 0, down: 0, neutral: 0 };
  const validation = { verified: 0, pending: 0, blocked: 0 };
  let latestDataThrough: string | null = null;
  let latestAnalyzedAt: string | null = null;
  for (const entry of entries) {
    direction[entry.direction]++;
    validation[entry.validation]++;
    if (latestDataThrough === null || entry.dataThrough > latestDataThrough) latestDataThrough = entry.dataThrough;
    if (latestAnalyzedAt === null || entry.analyzedAt > latestAnalyzedAt) latestAnalyzedAt = entry.analyzedAt;
  }
  return {
    analysisCount: entries.length,
    securityCount: new Set(entries.map(e => e.ticker)).size,
    direction, validation, latestDataThrough, latestAnalyzedAt,
    verifiedRate: entries.length ? validation.verified / entries.length : null,
  };
}
