import type { DataSource } from "@/data/DataSource";
import type { ProjectStatus } from "@/domain/project";

const projectStatus: ProjectStatus = {
  productName: "Tris Market Lens",
  sourceLabel: "Mock research snapshot",
  metrics: [
    {
      label: "Universe",
      value: "993",
      detail: "Approved KOSPI securities",
    },
    {
      label: "Market data",
      value: "1,099,255",
      detail: "Historical daily bars",
    },
    {
      label: "Qualified model",
      value: "HGB",
      detail: "Research inference artifact",
    },
    {
      label: "OOS evaluation",
      value: "Complete",
      detail: "Frozen out-of-sample dataset",
    },
  ],
  evidence: [
    {
      label: "Exchange calendar",
      state: "verified",
      detail: "Official market-wide calendar verified",
    },
    {
      label: "Settlement",
      state: "verified",
      detail: "T+2 session mapping verified",
    },
    {
      label: "DART evidence",
      state: "verified",
      detail: "Official disclosure evidence collected",
    },
    {
      label: "Security lifecycle",
      state: "in_progress",
      detail: "Historical lifecycle evidence is being reconciled",
    },
    {
      label: "Corporate actions",
      state: "blocked",
      detail: "Complete historical coverage is not verified yet",
    },
  ],
  baseline: [
    {
      label: "Run input freeze",
      state: "blocked",
      detail: "Waiting for remaining evidence blockers",
    },
    {
      label: "Historical backtest",
      state: "not_started",
      detail: "No locked historical baseline has been executed",
    },
  ],
};

export const mockDataSource: DataSource = {
  async getProjectStatus() {
    return projectStatus;
  },
};
