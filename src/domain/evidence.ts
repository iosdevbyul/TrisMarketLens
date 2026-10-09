import type { ProjectState } from "@/domain/project";

export type EvidenceLayerId =
  | "calendar"
  | "settlement"
  | "dart"
  | "security-lifecycle"
  | "corporate-actions";

export interface EvidenceLayerSummary {
  id: EvidenceLayerId;
  title: string;
  state: ProjectState;
  summary: string;
  sourceLabel: string;
}

export interface EvidenceMetric {
  label: string;
  value: string;
  detail: string;
}

export interface EvidenceDetail extends EvidenceLayerSummary {
  metrics: EvidenceMetric[];
  findings: string[];
  blocker: string | null;
  fingerprint: string | null;
  sourceScope: string;
}
