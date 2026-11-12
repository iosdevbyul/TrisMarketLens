import { isSourceCalendarDate } from "./sourceCalendarDate";

export type ResearchStatus = "completed" | "blocked" | "failed" | "pending";
export type ResearchOrigin = "real" | "synthetic_fixture";
export type ResearchPeriod = { start: string; end: string };
export type ResearchSourceReference = {
  referenceId: string;
  tradingDate: string;
  origin: "real_provider_https_local_capture" | "authorized_provider_mock_fixture";
};
export interface DailyResearchRecord {
  analysisId: string | null;
  jobReference: string;
  ticker: string;
  tradingDate: string;
  analyzedAt: string | null;
  modelId: string;
  modelVersion: string;
  status: ResearchStatus;
  reasonCode: string | null;
  attempt: number | null;
  dataOrigin: ResearchOrigin;
  usageRestriction: "research_only" | "synthetic_test_only";
  requestedPeriod: ResearchPeriod;
  observedPeriod: ResearchPeriod | null;
  inputFingerprint: string;
  inputFingerprintScope: "selected_job_universe";
  sources: ResearchSourceReference[];
  researchScore: number | null;
  researchContext: "prior_decline" | "prior_rise" | "flat" | null;
  researchSignal: "up" | "down" | "neutral" | "unavailable";
  displayThreshold: number;
  scoreMeaning: "uncalibrated_conditional_research_score";
  verification: "retained_artifact_integrity_not_fresh_source_replay";
  independentlyAuthenticatedChronology: false;
  independentlyAuthenticatedCustody: false;
  forwardPredictionEligible: false;
  pitQualified: false;
  performanceApproved: false;
  executionAuthorized: false;
  performanceMetrics: null;
}
export interface DailyResearchSeries {
  schemaVersion: "daily_research_series_v1";
  ticker: string;
  availability: "recorded" | "no_recorded_analysis";
  records: DailyResearchRecord[];
  totalRecords: number;
  offset: number;
  limit: number;
  lastSuccessfulAnalyzedAt: string | null;
  lastSuccessfulTradingDate: string | null;
  lastSuccessfulDataOrigin: ResearchOrigin | null;
  timestampAuthority: "local_operational_clock_not_authenticated";
}
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const oneOf = (v: unknown, values: readonly string[]): boolean => typeof v === "string" && values.includes(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const timestamp = (v: unknown): v is string => typeof v === "string" && /(Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
const period = (v: unknown): v is ResearchPeriod => object(v) && isSourceCalendarDate(v.start) && isSourceCalendarDate(v.end) && v.start <= v.end;
const origin = (v: unknown) => oneOf(v, ["real", "synthetic_fixture"]);
const safeInt = (v: unknown, min: number, max: number) => Number.isSafeInteger(v) && typeof v === "number" && v >= min && v <= max;
export function isDailyResearchSeries(value: unknown, ticker: string): value is DailyResearchSeries {
  if (!object(value) || value.schemaVersion !== "daily_research_series_v1" || value.ticker !== ticker ||
      !oneOf(value.availability, ["recorded", "no_recorded_analysis"]) ||
      !safeInt(value.totalRecords, 0, 100000) || !safeInt(value.offset, 0, 100000) ||
      !safeInt(value.limit, 1, 200) || !Array.isArray(value.records) || value.records.length > value.limit ||
      value.records.length > value.totalRecords ||
      value.timestampAuthority !== "local_operational_clock_not_authenticated") return false;
  if (value.availability === "no_recorded_analysis" && value.totalRecords !== 0) return false;
  if (value.availability === "recorded" && value.totalRecords === 0) return false;
  if (value.lastSuccessfulAnalyzedAt !== null && !timestamp(value.lastSuccessfulAnalyzedAt)) return false;
  if (value.lastSuccessfulTradingDate !== null && !isSourceCalendarDate(value.lastSuccessfulTradingDate)) return false;
  if (value.lastSuccessfulDataOrigin !== null && !origin(value.lastSuccessfulDataOrigin)) return false;
  const successes = [value.lastSuccessfulAnalyzedAt, value.lastSuccessfulTradingDate, value.lastSuccessfulDataOrigin];
  if (successes.some(v => v === null) && successes.some(v => v !== null)) return false;
  const ids = new Set<string>();
  let previousDate: string | null = null;
  return value.records.every((entry: unknown) => {
    if (!object(entry) || entry.ticker !== ticker || !text(entry.jobReference) || ids.has(entry.jobReference) ||
        !isSourceCalendarDate(entry.tradingDate) || (previousDate !== null && entry.tradingDate > previousDate) ||
        !text(entry.modelId) || !text(entry.modelVersion) ||
        !oneOf(entry.status, ["completed", "blocked", "failed", "pending"]) ||
        (entry.analyzedAt !== null && !timestamp(entry.analyzedAt)) ||
        (entry.analysisId !== null && !text(entry.analysisId)) ||
        (entry.reasonCode !== null && !text(entry.reasonCode)) ||
        (entry.attempt !== null && !safeInt(entry.attempt, 1, 100000)) ||
        !origin(entry.dataOrigin) ||
        entry.usageRestriction !== (entry.dataOrigin === "real" ? "research_only" : "synthetic_test_only") ||
        !period(entry.requestedPeriod) ||
        (entry.observedPeriod !== null && !period(entry.observedPeriod)) ||
        !text(entry.inputFingerprint) || entry.inputFingerprintScope !== "selected_job_universe" ||
        !Array.isArray(entry.sources) || entry.sources.length > 366 ||
        !entry.sources.every((s: unknown) => object(s) && text(s.referenceId) && isSourceCalendarDate(s.tradingDate) &&
          oneOf(s.origin, ["real_provider_https_local_capture", "authorized_provider_mock_fixture"])) ||
        (entry.researchScore !== null && (typeof entry.researchScore !== "number" || !Number.isFinite(entry.researchScore) || entry.researchScore < 0 || entry.researchScore > 1)) ||
        !oneOf(entry.researchSignal, ["up", "down", "neutral", "unavailable"]) ||
        (entry.researchContext !== null && !oneOf(entry.researchContext, ["prior_decline", "prior_rise", "flat"])) ||
        typeof entry.displayThreshold !== "number" || entry.displayThreshold !== 0.5 ||
        entry.scoreMeaning !== "uncalibrated_conditional_research_score" ||
        entry.verification !== "retained_artifact_integrity_not_fresh_source_replay" ||
        ["independentlyAuthenticatedChronology", "independentlyAuthenticatedCustody", "forwardPredictionEligible", "pitQualified", "performanceApproved", "executionAuthorized"].some(k => entry[k] !== false) ||
        entry.performanceMetrics !== null) return false;
    if (entry.status !== "completed" &&
        (entry.researchScore !== null || entry.researchSignal !== "unavailable" || entry.researchContext !== null)) return false;
    if (entry.status === "completed" && (entry.analysisId === null || entry.analyzedAt === null || entry.reasonCode !== null || entry.attempt === null || entry.observedPeriod === null || entry.researchSignal === "unavailable")) return false;
    if (entry.status === "pending" && (entry.analysisId !== null || entry.analyzedAt !== null || entry.attempt !== null)) return false;
    if (entry.status === "completed" && entry.researchContext === "flat" && (entry.researchScore !== null || entry.researchSignal !== "neutral")) return false;
    ids.add(entry.jobReference);
    previousDate = entry.tradingDate;
    return true;
  });
}
