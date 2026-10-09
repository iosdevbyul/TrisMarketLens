import type { DataSource } from "@/data/DataSource";
import type { ProjectStatus } from "@/domain/project";
import type { CoverageSummary, ModelSummary } from "@/domain/research";

const projectStatus: ProjectStatus = {
  productName: "Tris Market Lens",
  sourceLabel: "Mock research snapshot",
  metrics: [
    { label: "Universe", value: "993", detail: "Approved KOSPI securities" },
    { label: "Market data", value: "1,099,255", detail: "Historical daily bars" },
    { label: "Qualified model", value: "HGB", detail: "Research inference artifact" },
    { label: "OOS evaluation", value: "Complete", detail: "Frozen out-of-sample dataset" },
  ],
  evidence: [
    { label: "Exchange calendar", state: "verified", detail: "Official market-wide calendar verified" },
    { label: "Settlement", state: "verified", detail: "T+2 session mapping verified" },
    { label: "DART evidence", state: "verified", detail: "Official disclosure evidence collected" },
    { label: "Security lifecycle", state: "in_progress", detail: "43 securities still need historical lifecycle reconciliation" },
    { label: "Corporate actions", state: "blocked", detail: "Complete historical coverage is not verified yet" },
  ],
  baseline: [
    { label: "Run input freeze", state: "blocked", detail: "Waiting for remaining evidence blockers" },
    { label: "Historical backtest", state: "not_started", detail: "No locked historical baseline has been executed" },
  ],
};

const coverageSummary: CoverageSummary = {
  universe: 993,
  totalBars: 1_099_255,
  startDate: "2022-01-03",
  endDate: "2026-10-01",
  currentIdentityVerified: 871,
  historicalIdentityVerified: 0,
  unresolvedSecurities: 43,
  unexplainedTickerSessions: 8_118,
};

const modelSummaries: ModelSummary[] = [
  {
    direction: "Up",
    modelName: "HGB-7",
    validationAveragePrecision: 0.37486,
    oosAveragePrecision: 0.369409,
    note: "Executable baseline direction",
  },
  {
    direction: "Down",
    modelName: "HGB-15",
    validationAveragePrecision: 0.398382,
    oosAveragePrecision: 0.442473,
    note: "Qualified research model, not executable in the locked baseline",
  },
];

export const mockDataSource: DataSource = {
  async getProjectStatus() {
    return projectStatus;
  },
  async getCoverageSummary() {
    return coverageSummary;
  },
  async getModelSummaries() {
    return modelSummaries;
  },
};
