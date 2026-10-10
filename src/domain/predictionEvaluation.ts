export type EvaluationVerdict = "correct" | "incorrect" | "inconclusive" | "pending";
export interface PredictionEvaluation {
  id: string;
  analysisId: string;
  ticker: string;
  evaluatedAt: string | null;
  horizonSessions: number;
  referenceDate: string;
  referencePrice: number | null;
  evaluationDate: string | null;
  evaluationPrice: number | null;
  realizedReturn: number | null;
  verdict: EvaluationVerdict;
  policyId: string;
  explanation: string | null;
}
export interface PredictionEvaluationSnapshot { ticker: string; evaluations: PredictionEvaluation[] }
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
const timestamp = (value: unknown) => typeof value === "string" && /(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
export function isPredictionEvaluationSnapshot(value: unknown, ticker: string): value is PredictionEvaluationSnapshot {
  if (!value || typeof value !== "object") return false;
  const s=value as Record<string,unknown>;
  if (s.ticker !== ticker || !Array.isArray(s.evaluations) || s.evaluations.length > 500) return false;
  const ids = new Set<string>();
  return s.evaluations.every((candidate:unknown) => {
    if (!candidate || typeof candidate !== "object") return false;
    const e=candidate as Record<string,unknown>;
    if (typeof e.id !== "string" || !e.id || ids.has(e.id)) return false;
    ids.add(e.id);
    if (e.ticker !== ticker || typeof e.analysisId !== "string" || !e.analysisId || typeof e.policyId !== "string" || !e.policyId) return false;
    if (!Number.isInteger(e.horizonSessions) || (e.horizonSessions as number) < 1 || (e.horizonSessions as number) > 1000) return false;
    if (!date(e.referenceDate) || (e.evaluationDate !== null && !date(e.evaluationDate))) return false;
    if (e.evaluatedAt !== null && !timestamp(e.evaluatedAt)) return false;
    if (!["correct","incorrect","inconclusive","pending"].includes(String(e.verdict))) return false;
    for (const key of ["referencePrice","evaluationPrice","realizedReturn"]) {
      if (e[key] !== null && (typeof e[key] !== "number" || !Number.isFinite(e[key]))) return false;
    }
    if (e.referencePrice !== null && (e.referencePrice as number) <= 0) return false;
    if (e.evaluationPrice !== null && (e.evaluationPrice as number) <= 0) return false;
    if (e.explanation !== null && typeof e.explanation !== "string") return false;
    if (e.verdict === "pending" && (e.evaluatedAt !== null || e.evaluationDate !== null || e.evaluationPrice !== null || e.realizedReturn !== null)) return false;
    return true;
  });
}
