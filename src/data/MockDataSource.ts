import type { DataSource } from "@/data/DataSource";
import type { ProjectStatus } from "@/domain/project";
import type {
  CoverageSummary,
  ModelDetail,
  ModelDirection,
  ModelSummary,
} from "@/domain/research";
import type { StockDetail, StockSummary } from "@/domain/stock";

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

const models: ModelDetail[] = [
  {
    id: "up",
    direction: "Up",
    modelName: "HGB-7",
    role: "baseline_executable",
    validationAveragePrecision: 0.37486,
    oosAveragePrecision: 0.369409,
    note: "Executable direction in the locked long-only baseline.",
    selectionMeanAveragePrecision: 0.411851,
    selectionStdAveragePrecision: 0.036128,
    validation: {
      sampleCount: 55_081,
      precision: 0.348164,
      recall: 0.828423,
      f1: 0.490277,
      averagePrecision: 0.37486,
      brier: 0.264718,
    },
    oos: {
      sampleCount: 129_196,
      precision: 0.351497,
      recall: 0.76391,
      f1: 0.48146,
      averagePrecision: 0.369409,
      brier: 0.258437,
    },
    provenance: {
      artifactSha256: "43ffe774ce67f70c692a087183153b1cf5da86528ac36f2e2e78305daac29f60",
      featureSet: "ohlcv_value_v1",
      label: "reversal_barrier_v1",
      horizonSessions: 5,
      threshold: 0.5,
      maxLeafNodes: 7,
      learningRate: 0.05,
      maxIterations: 150,
      minSamplesLeaf: 100,
      l2Regularization: 1,
      maxBins: 255,
      classWeight: "balanced",
      earlyStopping: false,
      randomSeed: 42,
    },
  },
  {
    id: "down",
    direction: "Down",
    modelName: "HGB-15",
    role: "research_only",
    validationAveragePrecision: 0.398382,
    oosAveragePrecision: 0.442473,
    note: "Qualified research model; the locked baseline does not execute short trades.",
    selectionMeanAveragePrecision: 0.431781,
    selectionStdAveragePrecision: 0.050672,
    validation: {
      sampleCount: 46_006,
      precision: 0.355472,
      recall: 0.863953,
      f1: 0.503699,
      averagePrecision: 0.398382,
      brier: 0.269693,
    },
    oos: {
      sampleCount: 114_582,
      precision: 0.403392,
      recall: 0.763866,
      f1: 0.527968,
      averagePrecision: 0.442473,
      brier: 0.253538,
    },
    provenance: {
      artifactSha256: "42e3ed40c33b513a9ee066157ceada00b2b44c337259f817875f018e943a6b2c",
      featureSet: "ohlcv_value_v1",
      label: "reversal_barrier_v1",
      horizonSessions: 5,
      threshold: 0.5,
      maxLeafNodes: 15,
      learningRate: 0.05,
      maxIterations: 150,
      minSamplesLeaf: 100,
      l2Regularization: 1,
      maxBins: 255,
      classWeight: "balanced",
      earlyStopping: false,
      randomSeed: 42,
    },
  },
];

const stocks: StockDetail[] = [
  {
    ticker: "005930",
    name: "Samsung Electronics",
    market: "KOSPI",
    sector: "Semiconductors",
    dataStatus: "mock",
    availableFrom: "2022-01-03",
    latestDataDate: "2026-10-01",
    evidenceNote: "Per-security evidence will be loaded from DonghakStockVision.",
    chartNote: "No price values are fabricated in the mock UI.",
  },
  {
    ticker: "000660",
    name: "SK hynix",
    market: "KOSPI",
    sector: "Semiconductors",
    dataStatus: "mock",
    availableFrom: "2022-01-03",
    latestDataDate: "2026-10-01",
    evidenceNote: "Per-security evidence will be loaded from DonghakStockVision.",
    chartNote: "No price values are fabricated in the mock UI.",
  },
  {
    ticker: "005380",
    name: "Hyundai Motor",
    market: "KOSPI",
    sector: "Automobiles",
    dataStatus: "mock",
    availableFrom: "2022-01-03",
    latestDataDate: "2026-10-01",
    evidenceNote: "Per-security evidence will be loaded from DonghakStockVision.",
    chartNote: "No price values are fabricated in the mock UI.",
  },
  {
    ticker: "105560",
    name: "KB Financial Group",
    market: "KOSPI",
    sector: "Financials",
    dataStatus: "mock",
    availableFrom: "2022-01-03",
    latestDataDate: "2026-10-01",
    evidenceNote: "Per-security evidence will be loaded from DonghakStockVision.",
    chartNote: "No price values are fabricated in the mock UI.",
  },
];

export const mockDataSource: DataSource = {
  async getProjectStatus() {
    return projectStatus;
  },
  async getCoverageSummary() {
    return coverageSummary;
  },
  async getModelSummaries(): Promise<ModelSummary[]> {
    return models.map(
      ({
        id,
        direction,
        modelName,
        role,
        validationAveragePrecision,
        oosAveragePrecision,
        note,
      }) => ({
        id,
        direction,
        modelName,
        role,
        validationAveragePrecision,
        oosAveragePrecision,
        note,
      }),
    );
  },
  async getModel(direction: ModelDirection) {
    return models.find((model) => model.id === direction) ?? null;
  },
  async getStocks(): Promise<StockSummary[]> {
    return stocks.map(({ ticker, name, market, sector }) => ({
      ticker,
      name,
      market,
      sector,
    }));
  },
  async getStock(ticker: string) {
    return stocks.find((stock) => stock.ticker === ticker) ?? null;
  },
};
