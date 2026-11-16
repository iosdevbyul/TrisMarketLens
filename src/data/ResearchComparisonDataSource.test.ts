import { describe, expect, it, vi } from "vitest";
import type { DailyResearchRecord, DailyResearchSeries } from "../domain/dailyResearch";
import type { DailyResearchResult } from "./DailyResearchDataSource";
import {
  loadResearchComparison, parseResearchComparisonFilters,
  RESEARCH_COMPARISON_MAX_PAGES, RESEARCH_COMPARISON_PAGE_SIZE,
} from "./ResearchComparisonDataSource";

const ticker = "005930";
function record(index: number): DailyResearchRecord {
  return {
    jobReference: "job-" + index, ticker, tradingDate: "2026-11-12",
    modelId: "model-v1", modelVersion: "v1", dataOrigin: "real", status: "completed",
    researchScore: 0.5, researchSignal: "up",
  } as DailyResearchRecord;
}
function reply(offset: number, total: number, records: DailyResearchRecord[]): DailyResearchResult {
  return {
    source: "http", unavailable: false, error: null,
    data: {
      schemaVersion: "daily_research_series_v1", ticker, totalRecords: total, records, offset,
      limit: RESEARCH_COMPARISON_PAGE_SIZE,
    } as DailyResearchSeries,
  };
}
describe("bounded research comparison", () => {
  it("accepts strict calendar ranges", () => {
    expect(parseResearchComparisonFilters("2026-11-01", "2026-11-13")).toEqual({ fromDate: "2026-11-01", toDate: "2026-11-13" });
    expect(parseResearchComparisonFilters("2026-02-30", undefined)).toBeNull();
    expect(parseResearchComparisonFilters("2026-11-13", "2026-11-01")).toBeNull();
  });
  it("fetches consecutive source-backed pages and reports full coverage", async () => {
    const load = vi.fn(async (_ticker: string, options: { offset?: number }) => {
      const offset = options.offset ?? 0;
      return reply(offset, 205, Array.from({ length: Math.min(200, 205 - offset) }, (_, i) => record(offset + i)));
    });
    const result = await loadResearchComparison(ticker, {}, load);
    expect(result).toMatchObject({ state: "complete", examined: 205, totalRecords: 205, pagesFetched: 2 });
    expect(result.records).toHaveLength(205);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith(ticker, { limit: 200, offset: 200 });
  });
  it("caps retrieval and reports partial coverage rather than full history", async () => {
    const load = vi.fn(async (_ticker: string, options: { offset?: number }) => {
      const offset = options.offset ?? 0;
      return reply(offset, 1500, Array.from({ length: 200 }, (_, i) => record(offset + i)));
    });
    const result = await loadResearchComparison(ticker, {}, load);
    expect(result).toMatchObject({ state: "limited", examined: 1000, totalRecords: 1500, pagesFetched: 5 });
    expect(load).toHaveBeenCalledTimes(RESEARCH_COMPARISON_MAX_PAGES);
  });
  it("fails closed on changed counts, missing pages or repeated references", async () => {
    const first = Array.from({ length: 200 }, (_, i) => record(i));
    for (const second of [
      reply(200, 202, [record(200), record(201)]),
      reply(200, 201, [record(200)]),
      reply(200, 202, [record(0), record(201)]),
      reply(200, 202, [record(200)]),
    ]) {
      const load = vi.fn(async (_ticker: string, options: { offset?: number }) =>
        options.offset === 200 ? second : reply(0, 202, first));
      const result = await loadResearchComparison(ticker, {}, load);
      if (second.totalRecords === 202 && second.records.length === 2 && second.records[0].jobReference !== "job-0") {
        expect(result.state).toBe("complete");
      } else {
        expect(result).toMatchObject({ state: "unavailable", records: [], examined: 0 });
      }
    }
  });
  it("never substitutes demo records when source is disconnected", async () => {
    const outcome = await loadResearchComparison(ticker, {}, async () => ({
      source: "disconnected", data: null, error: null, unavailable: false,
    }));
    expect(outcome).toMatchObject({ state: "unavailable", records: [], totalRecords: null });
  });
});
