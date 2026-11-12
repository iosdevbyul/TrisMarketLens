import { describe, expect, it, vi } from "vitest";
import { isDailyResearchSeries } from "../domain/dailyResearch";
import { dailyResearchQuery, loadDailyResearch } from "./DailyResearchDataSource";

const ticker = "005930";
const record = {
  analysisId: "result-1", jobReference: "public-job-1", ticker, tradingDate: "2026-11-12",
  analyzedAt: "2026-11-12T18:30:00+09:00", modelId: "model-sha", modelVersion: "v1",
  status: "completed", reasonCode: null, attempt: 1, dataOrigin: "real",
  usageRestriction: "research_only",
  requestedPeriod: { start: "2026-10-01", end: "2026-11-12" },
  observedPeriod: { start: "2026-10-01", end: "2026-11-12" },
  inputFingerprint: "abc123", inputFingerprintScope: "selected_job_universe",
  sources: [{ referenceId: "public-source", tradingDate: "2026-11-12", origin: "real_provider_https_local_capture" }],
  researchScore: 0.72, researchContext: "prior_rise", researchSignal: "up",
  displayThreshold: 0.5, scoreMeaning: "uncalibrated_conditional_research_score",
  verification: "retained_artifact_integrity_not_fresh_source_replay",
  independentlyAuthenticatedChronology: false, independentlyAuthenticatedCustody: false,
  forwardPredictionEligible: false, pitQualified: false, performanceApproved: false,
  executionAuthorized: false, performanceMetrics: null,
} as const;
const series = {
  schemaVersion: "daily_research_series_v1", ticker, availability: "recorded",
  records: [record], totalRecords: 1, offset: 0, limit: 50,
  lastSuccessfulAnalyzedAt: "2026-11-12T18:30:00+09:00",
  lastSuccessfulTradingDate: "2026-11-12", lastSuccessfulDataOrigin: "real",
  timestampAuthority: "local_operational_clock_not_authenticated",
} as const;
const fetcher = (payload: unknown, status = 200) => vi.fn(async () => Response.json(payload, {status})) as unknown as typeof fetch;

describe("daily research (independent of approved publication)", () => {
  it("defaults to disconnected with no invented results", async () => {
    const result = await loadDailyResearch(ticker);
    expect(result.data).toBeNull();
    expect(result.source).toBe("disconnected");
  });
  it("accepts real series with provenance and limited research meaning", () => {
    expect(isDailyResearchSeries(series, ticker)).toBe(true);
  });
  it("passes exact date and pagination without cache", async () => {
    const f = fetcher({...series, limit: 10, offset: 0});
    const result = await loadDailyResearch(ticker, {mode:"http", apiBaseUrl:"http://localhost:8000/",fetcher:f, filters:{tradingDate:"2026-11-12",limit:10,offset:0}});
    expect(result.error).toBeNull();
    expect(f).toHaveBeenCalledWith("http://localhost:8000/api/v1/stocks/005930/research-analysis?tradingDate=2026-11-12&limit=10&offset=0", expect.objectContaining({cache:"no-store"}));
  });
  it("accepts inclusive date ranges and rejects invalid filter combinations", () => {
    expect(dailyResearchQuery({fromDate:"2026-11-01",toDate:"2026-11-12",offset:20}).toString()).toContain("offset=20");
    expect(() => dailyResearchQuery({tradingDate:"2026-11-12",fromDate:"2026-11-01"})).toThrow();
    expect(() => dailyResearchQuery({fromDate:"2026-11-12",toDate:"2026-11-01"})).toThrow();
    expect(() => dailyResearchQuery({limit:201})).toThrow();
    expect(() => dailyResearchQuery({tradingDate:"2026-02-30"})).toThrow();
  });
  it("distinguishes 503 from empty and never falls back to mock", async () => {
    const unavailable = await loadDailyResearch(ticker,{mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:fetcher({detail:"not configured"},503)});
    expect(unavailable.unavailable).toBe(true);
    expect(unavailable.data).toBeNull();
    const empty = { ...series, records:[], availability:"no_recorded_analysis",totalRecords:0,
      lastSuccessfulAnalyzedAt:null,lastSuccessfulTradingDate:null,lastSuccessfulDataOrigin:null };
    const result = await loadDailyResearch(ticker,{mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:fetcher(empty)});
    expect(result.error).toBeNull();
    expect(result.data?.records).toEqual([]);
  });
  it("accepts pending or blocked only with absent research scores and signal", () => {
    const blocked = {...record, status:"blocked", reasonCode:"insufficient_history",analysisId:null,attempt:1,analyzedAt:"2026-11-12T18:30:00+09:00",observedPeriod:null,researchScore:null,researchContext:null,researchSignal:"unavailable"};
    expect(isDailyResearchSeries({...series,records:[blocked]},ticker)).toBe(true);
    expect(isDailyResearchSeries({...series,records:[{...blocked,researchScore:0.8}]},ticker)).toBe(false);
    const pending = {...blocked,status:"pending",attempt:null,analyzedAt:null,reasonCode:null};
    expect(isDailyResearchSeries({...series,records:[pending]},ticker)).toBe(true);
  });
  it("rejects mismatched ticker, synthetic impersonation and approval claims", () => {
    expect(isDailyResearchSeries(series,"000660")).toBe(false);
    expect(isDailyResearchSeries({...series,records:[{...record,dataOrigin:"synthetic_fixture"}]},ticker)).toBe(false);
    expect(isDailyResearchSeries({...series,records:[{...record,forwardPredictionEligible:true}]},ticker)).toBe(false);
    expect(isDailyResearchSeries({...series,records:[{...record,researchScore:2}]},ticker)).toBe(false);
    const synthetic = {...record,dataOrigin:"synthetic_fixture",usageRestriction:"synthetic_test_only",sources:[{...record.sources[0],origin:"authorized_provider_mock_fixture"}]};
    expect(isDailyResearchSeries({...series,records:[synthetic],lastSuccessfulDataOrigin:"synthetic_fixture"},ticker)).toBe(true);
  });
  it("rejects malformed HTTP series rather than reusing old publication validator", async () => {
    const result = await loadDailyResearch(ticker,{mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:fetcher({ticker,records:[record]})});
    expect(result.error).toContain("invalid");
    expect(result.data).toBeNull();
  });
});
