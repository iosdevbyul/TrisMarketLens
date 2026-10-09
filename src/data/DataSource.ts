import type { ProjectStatus } from "@/domain/project";
import type { CoverageSummary, ModelSummary } from "@/domain/research";
import type { StockDetail, StockSummary } from "@/domain/stock";

export interface DataSource {
  getProjectStatus(): Promise<ProjectStatus>;
  getCoverageSummary(): Promise<CoverageSummary>;
  getModelSummaries(): Promise<ModelSummary[]>;
  getStocks(): Promise<StockSummary[]>;
  getStock(ticker: string): Promise<StockDetail | null>;
}
