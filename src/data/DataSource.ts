import type { ProjectStatus } from "@/domain/project";
import type { CoverageSummary, ModelSummary } from "@/domain/research";

export interface DataSource {
  getProjectStatus(): Promise<ProjectStatus>;
  getCoverageSummary(): Promise<CoverageSummary>;
  getModelSummaries(): Promise<ModelSummary[]>;
}
