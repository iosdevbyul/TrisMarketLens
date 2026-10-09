import type { ProjectState } from "@/domain/project";

export interface BacktestReadinessStep {
  label: string;
  state: ProjectState;
  detail: string;
}

export interface BacktestRule {
  label: string;
  value: string;
  detail: string;
}

export interface BacktestRuleGroup {
  title: string;
  rules: BacktestRule[];
}

export interface BacktestTimelineItem {
  label: string;
  value: string;
  detail: string;
}

export interface BacktestFingerprint {
  label: string;
  value: string;
}

export interface BaselineBacktestSnapshot {
  id: "baseline";
  title: string;
  state: "blocked";
  summary: string;
  readiness: BacktestReadinessStep[];
  timeline: BacktestTimelineItem[];
  policyGroups: BacktestRuleGroup[];
  fingerprints: BacktestFingerprint[];
  performanceAvailable: false;
}
