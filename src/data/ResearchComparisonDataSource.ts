import { getDailyResearch, type DailyResearchFilters, type DailyResearchResult } from "./DailyResearchDataSource";
import { isSourceCalendarDate } from "../domain/sourceCalendarDate";
import type { DailyResearchRecord } from "../domain/dailyResearch";

export const RESEARCH_COMPARISON_PAGE_SIZE = 200;
export const RESEARCH_COMPARISON_MAX_PAGES = 5;
export const RESEARCH_COMPARISON_MAX_RECORDS = RESEARCH_COMPARISON_PAGE_SIZE * RESEARCH_COMPARISON_MAX_PAGES;

export type ResearchComparisonFilters = Pick<DailyResearchFilters, "fromDate" | "toDate">;
export type ResearchComparisonResult = {
  state: "complete" | "limited" | "unavailable" | "invalid";
  records: DailyResearchRecord[];
  totalRecords: number | null;
  examined: number;
  pagesFetched: number;
  message: string;
};

function result(state: ResearchComparisonResult["state"], message: string): ResearchComparisonResult {
  return { state, records: [], totalRecords: null, examined: 0, pagesFetched: 0, message };
}

export function parseResearchComparisonFilters(
  fromDate: string | undefined,
  toDate: string | undefined,
): ResearchComparisonFilters | null {
  if (fromDate !== undefined && !isSourceCalendarDate(fromDate)) return null;
  if (toDate !== undefined && !isSourceCalendarDate(toDate)) return null;
  if (fromDate && toDate && fromDate > toDate) return null;
  return { fromDate, toDate };
}

export type ResearchPageLoader = (ticker: string, filters: DailyResearchFilters) => Promise<DailyResearchResult>;

/**
 * Fetch a bounded set of consecutive validated pages. The first page fixes the
 * expected count; inconsistent, duplicate or missing pages fail closed.
 * No market/LLM computation or backend mutation occurs.
 */
export async function loadResearchComparison(
  ticker: string,
  filters: ResearchComparisonFilters,
  loadPage: ResearchPageLoader = getDailyResearch,
): Promise<ResearchComparisonResult> {
  if (!/^[0-9A-Z]{6}$/.test(ticker) || !parseResearchComparisonFilters(filters.fromDate, filters.toDate)) {
    return result("invalid", "Ticker or comparison dates are invalid.");
  }
  const records: DailyResearchRecord[] = [];
  const references = new Set<string>();
  let expectedTotal: number | null = null;
  let previousLastDate: string | null = null;
  let pagesFetched = 0;
  for (let page = 0; page < RESEARCH_COMPARISON_MAX_PAGES; page++) {
    const offset = page * RESEARCH_COMPARISON_PAGE_SIZE;
    const reply = await loadPage(ticker, { ...filters, limit: RESEARCH_COMPARISON_PAGE_SIZE, offset });
    if (reply.source !== "http" || reply.error || !reply.data) {
      return result("unavailable", reply.error ?? "Real daily research publication is not connected.");
    }
    const data = reply.data;
    if (data.ticker !== ticker || data.offset !== offset || data.limit !== RESEARCH_COMPARISON_PAGE_SIZE ||
        (expectedTotal !== null && data.totalRecords !== expectedTotal) ||
        (expectedTotal === null && data.totalRecords > 100000)) {
      return result("unavailable", "Research publication changed during pagination; comparison was not displayed.");
    }
    expectedTotal ??= data.totalRecords;
    const remaining = expectedTotal - offset;
    if (remaining < 0 || data.records.length !== Math.min(RESEARCH_COMPARISON_PAGE_SIZE, remaining)) {
      return result("unavailable", "Research publication pages are inconsistent or incomplete.");
    }
    if (previousLastDate && data.records.length && data.records[0].tradingDate > previousLastDate) {
      return result("unavailable", "Research publication ordering changed during pagination.");
    }
    for (const entry of data.records) {
      if (references.has(entry.jobReference)) {
        return result("unavailable", "Research publication contains duplicate job references between pages.");
      }
      references.add(entry.jobReference);
      records.push(entry);
    }
    if (data.records.length) previousLastDate = data.records[data.records.length - 1].tradingDate;
    pagesFetched++;
    if (records.length === expectedTotal) {
      return {
        state: "complete", records, totalRecords: expectedTotal, examined: records.length, pagesFetched,
        message: "All matching published records were retrieved within the bounded request limit.",
      };
    }
  }
  return {
    state: "limited",
    records,
    totalRecords: expectedTotal,
    examined: records.length,
    pagesFetched,
    message: "Only the first 1,000 matching published records were retrieved. Counts are partial, not full-history metrics.",
  };
}
