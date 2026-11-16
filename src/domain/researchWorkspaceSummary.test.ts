import { describe, expect, it } from "vitest";
import type { AIManagementSnapshot } from "../data/AIModelManagementDataSource";
import type { DailyResearchResult } from "../data/DailyResearchDataSource";
import { researchSourceRows } from "./researchSourceStatus";
import { summarizeResearchWorkspace } from "./researchWorkspaceSummary";

const management: AIManagementSnapshot = {
  state: "available", message: "Connected", models: [{ key: "gemma" }],
  active: {
    selectedModelKey: "gemma-default", defaultModelKey: "baseline",
    selectionVersion: 3, busy: false,
    lastApplied: { modelKey: "gemma-default" },
  },
  history: [],
  comparisons: [
    { comparisonContractId: "same", modelKey: "gemma", runId: "a" },
    { comparisonContractId: "same", modelKey: "baseline", runId: "b" },
    { comparisonContractId: "other", modelKey: "gemma", runId: "c" },
    { modelKey: "unknown", runId: "d" },
  ],
  partialErrors: [],
};
const daily: DailyResearchResult = {
  source: "http", error: null, unavailable: false,
  data: {
    ticker: "005930", totalRecords: 24, records: [
      { tradingDate: "2026-11-15", jobReference: "j1", status: "completed", dataOrigin: "real", modelId: "dir", modelVersion: "v1", researchSignal: "up", researchScore: 0.6 },
      { tradingDate: "2026-11-14", jobReference: "j2", status: "blocked", dataOrigin: "synthetic_fixture", modelId: "dir", modelVersion: "v2", researchSignal: "unavailable", researchScore: null },
    ],
  } as unknown as NonNullable<DailyResearchResult["data"]>,
};

function assemble(m = management, d: DailyResearchResult | null = daily, mode = "http") {
  const sources = researchSourceRows({
    sourceMode: mode,
    health: mode === "http" ? { status: "ok", service: "DonghakStockVision", mode: "read_only" } : null,
    management: m, daily: d, ticker: d ? "005930" : null,
  });
  return summarizeResearchWorkspace(sources, m, d);
}

describe("integrated research workspace", () => {
  it("uses only actual model selection and job publication evidence", () => {
    expect(assemble()).toMatchObject({
      overview: "observed",
      selectedModelKey: "gemma-default", defaultModelKey: "baseline",
      lastAppliedModelKey: "gemma-default", selectionVersion: 3, modelBusy: false,
      comparisonContracts: 2, matchedContracts: 1, unclassifiedComparisons: 1,
      totalResearchRecords: 24, previewRecords: 2, previewCompleted: 1, previewBlocked: 1,
      previewReal: 1, previewSynthetic: 1, lastTradingDate: "2026-11-15",
      previewDistinctModels: 2,
    });
  });
  it("does not invent counts or last-applied models when management is disconnected", () => {
    const missing: AIManagementSnapshot = {
      ...management, state: "unconfigured", active: null, models: [], comparisons: [],
    };
    expect(assemble(missing, null, "mock")).toMatchObject({
      overview: "demo", selectedModelKey: null, lastAppliedModelKey: null,
      comparisonContracts: null, matchedContracts: null, previewRecords: null,
    });
  });
  it("distinguishes failed comparison publication from an empty list", () => {
    const absent: AIManagementSnapshot = {
      ...management, comparisons: [],
      partialErrors: ["Research comparisons are currently unavailable."],
    };
    expect(assemble(absent).comparisonContracts).toBeNull();
    expect(assemble({ ...management, comparisons: [] }).comparisonContracts).toBe(0);
  });
  it("does not infer applied model identity from selected model", () => {
    const snapshot = {
      ...management,
      active: { selectedModelKey: "selected", defaultModelKey: "default", lastApplied: null, busy: true },
    };
    expect(assemble(snapshot)).toMatchObject({
      selectedModelKey: "selected", lastAppliedModelKey: null, modelBusy: true,
    });
  });
  it("keeps unknown or failed ticker publications unknown", () => {
    const failed: DailyResearchResult = { source: "http", data: null, error: "HTTP 503", unavailable: true };
    expect(assemble(management, failed)).toMatchObject({ overview: "partial", previewRecords: null, totalResearchRecords: null });
  });
});
