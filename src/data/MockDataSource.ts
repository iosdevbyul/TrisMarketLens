import type { DataSource } from "@/data/DataSource";
import type { EvidenceDetail, EvidenceLayerId, EvidenceLayerSummary } from "@/domain/evidence";
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

const evidenceLayers: EvidenceDetail[] = [
  {
    id: "calendar",
    title: "Exchange calendar",
    state: "verified",
    summary:
      "The official market-wide session calendar is verified for the baseline window, while security-level missing sessions remain a separate lifecycle blocker.",
    sourceLabel: "KIND / KRX",
    sourceScope: "Official exchange trading calendar",
    metrics: [
      {
        label: "Coverage",
        value: "2024-06-01 → 2025-07-31",
        detail: "Official calendar evidence window",
      },
      {
        label: "Trading sessions",
        value: "283",
        detail: "Sessions in the 14 monthly responses",
      },
      {
        label: "Calendar days",
        value: "426",
        detail: "Days represented in the preserved official responses",
      },
    ],
    findings: [
      "Fourteen monthly official responses were preserved for offline verification.",
      "2025-03-21 is an exchange trading session but remains an approved research exclusion.",
      "The market-wide date union matches the official calendar for the verified window.",
    ],
    blocker: null,
    fingerprint:
      "6501a1...dc7b",
  },
  {
    id: "settlement",
    title: "Settlement",
    state: "verified",
    summary:
      "Official T+2 settlement evidence is mapped for the baseline entry and exit sessions.",
    sourceLabel: "KRX",
    sourceScope: "Official settlement convention and session mapping",
    metrics: [
      {
        label: "Convention",
        value: "T+2",
        detail: "Settlement timing used by the baseline contract",
      },
      {
        label: "Mapped sessions",
        value: "244",
        detail: "Possible entry and exit sessions with settlement dates",
      },
      {
        label: "Settlement tail",
        value: "2025-07-08 → 2025-07-09",
        detail: "Tail needed after the final execution-only session",
      },
    ],
    findings: [
      "The execution-only tail runs through 2025-07-07.",
      "A final exit on 2025-07-07 settles on 2025-07-09.",
      "Settlement evidence is preserved independently from the backtest runner.",
    ],
    blocker: null,
    fingerprint:
      "1040c8...8f99",
  },
  {
    id: "dart",
    title: "DART evidence",
    state: "verified",
    summary:
      "The official DART acquisition package is reproducible and secret-safe, but current corporation mapping is not equivalent to historical identity continuity.",
    sourceLabel: "Open DART / KIND",
    sourceScope: "Official corporation codes, disclosures, documents, and listing notices",
    metrics: [
      {
        label: "Current mapping",
        value: "871 / 993",
        detail: "Exact current stock-code mapping from official corporation codes",
      },
      {
        label: "Current unresolved",
        value: "122",
        detail: "Securities without verified current official mapping",
      },
      {
        label: "Network acquisitions",
        value: "1,626",
        detail: "Preserved requests in the evidence package",
      },
      {
        label: "Candidate disclosures",
        value: "3,108",
        detail: "Review candidates, not confirmed economic events",
      },
    ],
    findings: [
      "Credential availability is resolved without persisting API secrets.",
      "Saved responses and artifacts reproduce offline from committed evidence.",
      "Current corporation mapping does not prove historical ticker identity.",
    ],
    blocker: null,
    fingerprint:
      "4118ba...14d86",
  },
  {
    id: "security-lifecycle",
    title: "Security lifecycle",
    state: "in_progress",
    summary:
      "Official listing, delisting, suspension, and identity-transition evidence is still being reconciled against unexplained ticker sessions.",
    sourceLabel: "KIND / KRX / DART",
    sourceScope: "Official security lifecycle events and effective-date intervals",
    metrics: [
      {
        label: "Unresolved securities",
        value: "43",
        detail: "Securities still carrying unexplained session gaps",
      },
      {
        label: "Unexplained sessions",
        value: "8,118",
        detail: "Ticker-sessions still requiring official lifecycle evidence",
      },
      {
        label: "Already explained",
        value: "436",
        detail: "Sessions explained by three verified new-listing boundaries",
      },
    ],
    findings: [
      "Three listing boundaries are verified: 062040, 031210, and 483650.",
      "A missing bar is never treated as proof of suspension, delisting, or identity transition.",
      "The calendar blocker remains open until every remaining ticker-session is explained or explicitly unresolved by the approved evidence contract.",
    ],
    blocker:
      "8,118 ticker-sessions across 43 securities still require official lifecycle reconciliation.",
    fingerprint:
      "159c70...2a170",
  },
  {
    id: "corporate-actions",
    title: "Corporate actions",
    state: "blocked",
    summary:
      "Complete historical corporate-action and identity coverage is not yet established for the approved 993-security universe.",
    sourceLabel: "DART / KIND / KRX",
    sourceScope: "Official corporate actions, corrections, effective dates, and historical identity",
    metrics: [
      {
        label: "Complete coverage",
        value: "0 / 993",
        detail: "Full-period corporate-action coverage verified",
      },
      {
        label: "Historical identity",
        value: "0 / 993",
        detail: "Full required-period identity continuity verified",
      },
      {
        label: "Candidate documents",
        value: "1,648",
        detail: "Official documents linked to approved-universe stock codes for review",
      },
    ],
    findings: [
      "Candidate disclosures are not treated as confirmed economic events.",
      "Decision dates and effective dates must remain distinct.",
      "Correction chains and historical identity semantics must be verified before the blocker can close.",
    ],
    blocker:
      "Historical identity, event class, correction-chain, and effective-date coverage remain incomplete.",
    fingerprint:
      "0f8834...9d52",
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
  async getEvidenceLayers(): Promise<EvidenceLayerSummary[]> {
    return evidenceLayers.map(({ id, title, state, summary, sourceLabel }) => ({
      id,
      title,
      state,
      summary,
      sourceLabel,
    }));
  },
  async getEvidenceLayer(id: EvidenceLayerId) {
    return evidenceLayers.find((layer) => layer.id === id) ?? null;
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
