export interface CoverageSummary {
  universe: number;
  totalBars: number;
  startDate: string;
  endDate: string;
  currentIdentityVerified: number;
  historicalIdentityVerified: number;
  unresolvedSecurities: number;
  unexplainedTickerSessions: number;
}

export type ModelDirection = "up" | "down";
export type ModelRole = "baseline_executable" | "research_only";

export interface ModelSummary {
  id: ModelDirection;
  direction: "Up" | "Down";
  modelName: string;
  role: ModelRole;
  validationAveragePrecision: number;
  oosAveragePrecision: number;
  note: string;
}

export interface ClassificationMetrics {
  sampleCount: number;
  precision: number;
  recall: number;
  f1: number;
  averagePrecision: number;
  brier: number;
}

export interface ModelProvenance {
  artifactSha256: string;
  featureSet: string;
  label: string;
  horizonSessions: number;
  threshold: number;
  maxLeafNodes: number;
  learningRate: number;
  maxIterations: number;
  minSamplesLeaf: number;
  l2Regularization: number;
  maxBins: number;
  classWeight: string;
  earlyStopping: boolean;
  randomSeed: number;
}

export interface ModelDetail extends ModelSummary {
  selectionMeanAveragePrecision: number;
  selectionStdAveragePrecision: number;
  validation: ClassificationMetrics;
  oos: ClassificationMetrics;
  provenance: ModelProvenance;
}
