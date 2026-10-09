import type { BaselineBacktestSnapshot } from "@/domain/backtest";
import type { EvidenceDetail, EvidenceLayerId, EvidenceLayerSummary } from "@/domain/evidence";
import type { ProjectStatus } from "@/domain/project";
import type {
  CoverageSummary,
  ModelDetail,
  ModelDirection,
  ModelSummary,
} from "@/domain/research";
import type { StockDetail, StockSummary } from "@/domain/stock";

export interface DataSource {
  getProjectStatus(): Promise<ProjectStatus>;
  getCoverageSummary(): Promise<CoverageSummary>;
  getModelSummaries(): Promise<ModelSummary[]>;
  getModel(direction: ModelDirection): Promise<ModelDetail | null>;
  getEvidenceLayers(): Promise<EvidenceLayerSummary[]>;
  getEvidenceLayer(id: EvidenceLayerId): Promise<EvidenceDetail | null>;
  getBaselineBacktest(): Promise<BaselineBacktestSnapshot>;
  getStocks(): Promise<StockSummary[]>;
  getStock(ticker: string): Promise<StockDetail | null>;
}
