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

export interface ModelSummary {
  direction: "Up" | "Down";
  modelName: string;
  validationAveragePrecision: number;
  oosAveragePrecision: number;
  note: string;
}
