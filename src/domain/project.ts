export type ProjectState =
  | "verified"
  | "in_progress"
  | "blocked"
  | "not_started";

export interface SummaryMetric {
  label: string;
  value: string;
  detail: string;
}

export interface ResearchCheckpoint {
  label: string;
  state: ProjectState;
  detail: string;
}

export interface ProjectStatus {
  productName: string;
  sourceLabel: string;
  metrics: SummaryMetric[];
  evidence: ResearchCheckpoint[];
  baseline: ResearchCheckpoint[];
}
