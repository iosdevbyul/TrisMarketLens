import type { StockAnalysisRecord } from "./stockAnalysis";
import type { OhlcvBar } from "./ohlcv";

/** A marker represents an analysis data-through date, NOT a trade/execution signal. */
export interface ChartAnalysisMarker {
  date: string;
  records: StockAnalysisRecord[];
}
export function groupChartAnalyses(bars: OhlcvBar[], records: StockAnalysisRecord[]): ChartAnalysisMarker[] {
  const availableDates = new Set(bars.map(bar => bar.date));
  const byDate = new Map<string, StockAnalysisRecord[]>();
  for (const record of records) {
    if (!availableDates.has(record.dataThrough)) continue;
    const current = byDate.get(record.dataThrough) ?? [];
    current.push(record);
    byDate.set(record.dataThrough, current);
  }
  return Array.from(byDate, ([date, entries]) => ({
    date,
    records: [...entries].sort((a,b) => a.id.localeCompare(b.id)),
  })).sort((a,b) => a.date.localeCompare(b.date));
}
