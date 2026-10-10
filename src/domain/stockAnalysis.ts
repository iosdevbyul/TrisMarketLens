export type AnalysisDirection = "up" | "down" | "neutral";
export type AnalysisValidation = "verified" | "blocked" | "pending";
export interface StockAnalysisRecord {
  id: string;
  ticker: string;
  analyzedAt: string;
  dataThrough: string;
  modelId: string;
  modelVersion: string;
  direction: AnalysisDirection;
  score: number | null;
  validation: AnalysisValidation;
  explanation: string | null;
}
export interface StockAnalysisSnapshot {
  ticker: string;
  records: StockAnalysisRecord[];
}
export function isStockAnalysisSnapshot(value: unknown, ticker: string): value is StockAnalysisSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  if (snapshot.ticker !== ticker || !Array.isArray(snapshot.records) || snapshot.records.length > 500) return false;
  const ids = new Set<string>();
  return snapshot.records.every((value: unknown) => {
    if (!value || typeof value !== "object") return false;
    const r = value as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id || ids.has(r.id) || r.ticker !== ticker) return false;
    ids.add(r.id);
    if (typeof r.modelId !== "string" || !r.modelId || typeof r.modelVersion !== "string" || !r.modelVersion) return false;
    if (typeof r.analyzedAt !== "string" || !/(Z|[+-]\\d{2}:\\d{2})$/.test(r.analyzedAt) || !Number.isFinite(Date.parse(r.analyzedAt))) return false;
    if (typeof r.dataThrough !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(r.dataThrough) || !Number.isFinite(Date.parse(r.dataThrough))) return false;
    if (!["up", "down", "neutral"].includes(String(r.direction))) return false;
    if (!["verified", "blocked", "pending"].includes(String(r.validation))) return false;
    if (r.score !== null && (typeof r.score !== "number" || !Number.isFinite(r.score) || r.score < 0 || r.score > 1)) return false;
    return r.explanation === null || typeof r.explanation === "string";
  });
}
