import Link from "next/link";

import type { EvidenceLayerSummary } from "@/domain/evidence";

const stateLabel = {
  verified: "Verified",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Not started",
} as const;

export function EvidenceCard({ layer }: { layer: EvidenceLayerSummary }) {
  return (
    <Link className="panel evidence-card" href={"/evidence/" + layer.id}>
      <div className="evidence-card-header">
        <div>
          <p className="eyebrow">{layer.sourceLabel}</p>
          <h2>{layer.title}</h2>
        </div>
        <span className="status-pill" data-state={layer.state}>
          {stateLabel[layer.state]}
        </span>
      </div>
      <p className="section-copy">{layer.summary}</p>
      <span className="evidence-card-action">View evidence details →</span>
    </Link>
  );
}
