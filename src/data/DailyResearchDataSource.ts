import { isSourceCalendarDate } from "../domain/sourceCalendarDate";
import { isDailyResearchSeries, type DailyResearchSeries } from "../domain/dailyResearch";
export type DailyResearchMode = "disconnected" | "http";
export type DailyResearchFilters = { tradingDate?: string; fromDate?: string; toDate?: string; limit?: number; offset?: number };
export type DailyResearchResult = { source: DailyResearchMode; data: DailyResearchSeries | null; error: string | null; unavailable: boolean };
export type DailyResearchOptions = { mode?: string; apiBaseUrl?: string; fetcher?: typeof fetch; filters?: DailyResearchFilters };
export function dailyResearchQuery(filters: DailyResearchFilters = {}): URLSearchParams {
  const { tradingDate, fromDate, toDate, limit = 50, offset = 0 } = filters;
  if ([tradingDate, fromDate, toDate].some(v => v !== undefined && !isSourceCalendarDate(v)) ||
      (tradingDate !== undefined && (fromDate !== undefined || toDate !== undefined)) ||
      (fromDate && toDate && fromDate > toDate) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 200 ||
      !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new Error("Invalid daily research filters");
  const query = new URLSearchParams();
  if (tradingDate) query.set("tradingDate", tradingDate);
  if (fromDate) query.set("fromDate", fromDate);
  if (toDate) query.set("toDate", toDate);
  query.set("limit", String(limit));
  query.set("offset", String(offset));
  return query;
}
export async function loadDailyResearch(ticker: string, { mode = "disconnected", apiBaseUrl, fetcher = fetch, filters = {} }: DailyResearchOptions = {}): Promise<DailyResearchResult> {
  const empty = (error: string | null, unavailable = false): DailyResearchResult => ({ source: mode === "http" ? "http" : "disconnected", data: null, error, unavailable });
  if (mode === "disconnected") return empty(null);
  if (mode !== "http") return empty("Unsupported daily research mode");
  if (!apiBaseUrl?.trim()) return empty("Daily research API base URL is not configured");
  if (!/^[0-9A-Z]{6}$/.test(ticker)) return empty("Invalid ticker");
  let query: URLSearchParams;
  try { query = dailyResearchQuery(filters); } catch { return empty("Invalid daily research filters"); }
  try {
    const url = apiBaseUrl.trim().replace(/\/+$/, "") + "/api/v1/stocks/" + encodeURIComponent(ticker) + "/research-analysis?" + query;
    const response = await fetcher(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.status === 503) return empty("Daily research operational snapshot is not configured (HTTP 503)", true);
    if (!response.ok) return empty("Daily research API returned HTTP " + response.status);
    const body: unknown = await response.json();
    if (!isDailyResearchSeries(body, ticker) || body.offset !== Number(query.get("offset")) || body.limit !== Number(query.get("limit"))) return empty("Daily research API returned an invalid series");
    return { source: "http", data: body, error: null, unavailable: false };
  } catch { return empty("Daily research API is unreachable"); }
}
export function getDailyResearch(ticker: string, filters: DailyResearchFilters = {}): Promise<DailyResearchResult> {
  return loadDailyResearch(ticker, { mode: process.env.MARKET_LENS_DAILY_RESEARCH_SOURCE ?? "disconnected", apiBaseUrl: process.env.DONGHAK_API_BASE_URL, filters });
}
