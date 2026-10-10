export interface OhlcvBar { date: string; open: number; high: number; low: number; close: number; volume: number }
export interface OhlcvSeries { ticker: string; bars: OhlcvBar[] }
export function isOhlcvSeries(input: unknown, ticker: string): input is OhlcvSeries {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  if (value.ticker !== ticker || !Array.isArray(value.bars) || value.bars.length > 2500) return false;
  let previous = "";
  return value.bars.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const bar = item as Record<string, unknown>;
    if (typeof bar.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(bar.date) || !Number.isFinite(Date.parse(bar.date)) || bar.date <= previous) return false;
    previous = bar.date;
    const numbers = ["open","high","low","close","volume"];
    if (!numbers.every(key => typeof bar[key] === "number" && Number.isFinite(bar[key]) && (bar[key] as number) >= 0)) return false;
    const o = bar.open as number, h = bar.high as number, l = bar.low as number, c = bar.close as number;
    const noTrade = o === 0 && h === 0 && l === 0 && c > 0 && bar.volume === 0;
    return Number.isInteger(bar.volume) && (noTrade || (o > 0 && c > 0 && l > 0 && h >= Math.max(o,c,l) && l <= Math.min(o,c) && h >= l));
  });
}
