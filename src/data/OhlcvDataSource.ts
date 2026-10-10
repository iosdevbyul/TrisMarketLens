import { isOhlcvSeries, type OhlcvSeries } from "../domain/ohlcv";
export type OhlcvMode = "disconnected" | "mock" | "http";
export interface OhlcvResult { source: OhlcvMode; data: OhlcvSeries; error: string | null }
export interface OhlcvOptions { mode?: string; apiBaseUrl?: string; fetcher?: typeof fetch }
/** Completely artificial example values for UI testing. Never market prices. */
export function demoOhlcv(ticker: string): OhlcvSeries {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 6, 1 + i));
    const base = 100 + i * 0.35 + Math.sin(i * 0.6) * 5;
    const open = Math.round((base - Math.sin(i) * 1.6) * 100) / 100;
    const close = Math.round((base + Math.cos(i * 0.7) * 1.8) * 100) / 100;
    return { date: d.toISOString().slice(0, 10), open, close, high: Math.round((Math.max(open, close) + 2) * 100) / 100, low: Math.round((Math.min(open, close) - 2) * 100) / 100, volume: 50000 + ((i * 7919) % 90000) };
  }).filter(b => { const day = new Date(b.date + "T00:00:00Z").getUTCDay(); return day !== 0 && day !== 6; });
  return { ticker, bars };
}
export async function loadOhlcv(ticker: string, { mode = "disconnected", apiBaseUrl, fetcher = fetch }: OhlcvOptions = {}): Promise<OhlcvResult> {
  const empty: OhlcvSeries = { ticker, bars: [] };
  if (mode === "disconnected") return { source: "disconnected", data: empty, error: null };
  if (mode === "mock") return { source: "mock", data: demoOhlcv(ticker), error: null };
  if (mode !== "http") return { source: "disconnected", data: empty, error: "Unsupported OHLCV mode" };
  if (!apiBaseUrl?.trim()) return { source: "http", data: empty, error: "OHLCV API base URL not configured" };
  try {
    const response = await fetcher(apiBaseUrl.trim().replace(/\/+$/, "") + "/api/v1/stocks/" + encodeURIComponent(ticker) + "/ohlcv", {
      headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { source: "http", data: empty, error: `OHLCV API returned HTTP ${response.status}` };
    const body: unknown = await response.json();
    if (!isOhlcvSeries(body, ticker)) return { source: "http", data: empty, error: "OHLCV API returned invalid candles" };
    return { source: "http", data: body, error: null };
  } catch {
    return { source: "http", data: empty, error: "OHLCV API is unreachable" };
  }
}
export function getOhlcv(ticker: string): Promise<OhlcvResult> {
  return loadOhlcv(ticker, { mode: process.env.MARKET_LENS_OHLCV_SOURCE ?? "disconnected", apiBaseUrl: process.env.DONGHAK_API_BASE_URL });
}
