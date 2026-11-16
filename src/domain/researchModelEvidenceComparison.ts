import type { DailyResearchRecord, ResearchOrigin, ResearchStatus } from "./dailyResearch";

export type ResearchModelEvidenceRow = {
  modelId: string;
  modelVersion: string;
  origin: ResearchOrigin;
  count: number;
  completed: number;
  pending: number;
  blocked: number;
  failed: number;
  scoreRecorded: number;
  directions: { up: number; down: number; neutral: number };
  firstTradingDate: string;
  lastTradingDate: string;
  distinctJobReferences: number;
};

type MutableRow = ResearchModelEvidenceRow & { references: Set<string> };
const statuses: readonly ResearchStatus[] = ["completed", "pending", "blocked", "failed"];

/** Describes the current validated response page only. No inferred accuracy, investment return, or experiment-memory data. */
export function compareVisibleResearchModels(records: readonly DailyResearchRecord[]): ResearchModelEvidenceRow[] {
  const groups = new Map<string, MutableRow>();
  for (const record of records) {
    if (!statuses.includes(record.status)) continue;
    const key = JSON.stringify([record.modelId, record.modelVersion, record.dataOrigin]);
    let row = groups.get(key);
    if (!row) {
      row = {
        modelId: record.modelId,
        modelVersion: record.modelVersion,
        origin: record.dataOrigin,
        count: 0, completed: 0, pending: 0, blocked: 0, failed: 0, scoreRecorded: 0,
        directions: { up: 0, down: 0, neutral: 0 },
        firstTradingDate: record.tradingDate, lastTradingDate: record.tradingDate,
        distinctJobReferences: 0, references: new Set<string>(),
      };
      groups.set(key, row);
    }
    row.count++;
    row[record.status]++;
    if (record.status === "completed") {
      if (record.researchScore !== null) row.scoreRecorded++;
      if (record.researchSignal === "up" || record.researchSignal === "down" || record.researchSignal === "neutral") {
        row.directions[record.researchSignal]++;
      }
    }
    if (record.tradingDate < row.firstTradingDate) row.firstTradingDate = record.tradingDate;
    if (record.tradingDate > row.lastTradingDate) row.lastTradingDate = record.tradingDate;
    row.references.add(record.jobReference);
  }
  return [...groups.values()].map(({ references, ...row }) => ({
    ...row,
    distinctJobReferences: references.size,
  })).sort((a, b) =>
    b.lastTradingDate.localeCompare(a.lastTradingDate)
    || a.modelId.localeCompare(b.modelId)
    || a.modelVersion.localeCompare(b.modelVersion)
    || a.origin.localeCompare(b.origin),
  );
}
