import Link from "next/link";

import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";

import type { EvidenceLayerSummary } from "@/domain/evidence";

export function EvidenceCard({ layer }: { layer: EvidenceLayerSummary }) {
  return (
    <Link className="panel evidence-card" href={"/evidence/" + layer.id}>
      <div className="evidence-card-header">
        <div>
          <p className="eyebrow">{layer.sourceLabel}</p>
          <h2>{layer.title}</h2>
        </div>
        <WakStatusBadge state={layer.state} />
      </div>
      <p className="section-copy">{layer.summary}</p>
      <span className="evidence-card-action">View evidence details →</span>
    </Link>
  );
}
