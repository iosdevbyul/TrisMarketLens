import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { mockDataSource } from "@/data/MockDataSource";
import type { EvidenceLayerId } from "@/domain/evidence";

interface EvidenceDetailPageProps {
  params: Promise<{ layer: string }>;
}

const validEvidenceLayers: EvidenceLayerId[] = [
  "calendar",
  "settlement",
  "dart",
  "security-lifecycle",
  "corporate-actions",
];

function isEvidenceLayer(value: string): value is EvidenceLayerId {
  return validEvidenceLayers.includes(value as EvidenceLayerId);
}

const stateLabel = {
  verified: "Verified",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Not started",
} as const;

export default async function EvidenceDetailPage({
  params,
}: EvidenceDetailPageProps) {
  const { layer } = await params;

  if (!isEvidenceLayer(layer)) {
    notFound();
  }

  const evidence = await mockDataSource.getEvidenceLayer(layer);

  if (!evidence) {
    notFound();
  }

  return (
    <>
      <Link className="back-link" href="/evidence">
        ← Back to evidence
      </Link>

      <PageHeader
        badge={stateLabel[evidence.state]}
        description={evidence.summary}
        eyebrow={evidence.sourceLabel}
        title={evidence.title}
      />

      <section className="evidence-metric-grid">
        {evidence.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="evidence-metric-value">{metric.value}</p>
            <p className="metric-detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel-grid evidence-detail-panels">
        <article className="panel">
          <p className="eyebrow">Verified findings</p>
          <h2>What the evidence supports</h2>
          <ul className="finding-list">
            {evidence.findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Evidence contract</p>
          <h2>Source and blocker state</h2>
          <dl className="metric-list">
            <div>
              <dt>Source scope</dt>
              <dd>{evidence.sourceScope}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{stateLabel[evidence.state]}</dd>
            </div>
          </dl>

          {evidence.blocker ? (
            <div className="run-lock evidence-blocker">
              <p>Blocker remains open.</p>
              <span>{evidence.blocker}</span>
            </div>
          ) : (
            <div className="verified-note">
              <p>This evidence layer is verified for its stated scope.</p>
              <span>
                Verification does not imply that separate lifecycle or corporate-action
                blockers are resolved.
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">Artifact identity</p>
        <h2>Evidence fingerprint</h2>
        {evidence.fingerprint ? (
          <code className="artifact-sha">{evidence.fingerprint}</code>
        ) : (
          <p className="section-copy">No fingerprint is exposed in this mock snapshot.</p>
        )}
        <p className="section-copy">
          The web is displaying the research snapshot only. It does not recollect,
          regenerate, or reinterpret official evidence.
        </p>
      </section>
    </>
  );
}
