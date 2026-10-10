import { getTranslator } from "@/i18n/server";
import Link from "next/link";

import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";

import type { EvidenceLayerSummary } from "@/domain/evidence";

export async function EvidenceCard({ layer }: { layer: EvidenceLayerSummary }) {
  const t = await getTranslator();
  return (
    <Link className="panel evidence-card" href={"/evidence/" + layer.id}>
      <div className="evidence-card-header">
        <div>
          <p className="eyebrow">{t(layer.sourceLabel)}</p>
          <h2>{t(layer.title)}</h2>
        </div>
        <WakStatusBadge state={layer.state} />
      </div>
      <p className="section-copy">{t(layer.summary)}</p>
      <span className="evidence-card-action">{t("View evidence details →")}</span>
    </Link>
  );
}
