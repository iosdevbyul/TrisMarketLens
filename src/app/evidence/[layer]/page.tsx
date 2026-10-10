import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { getDataSource } from "@/data/getDataSource";
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
  const t = await getTranslator();
  const dataSource = getDataSource();
  const { layer } = await params;

  if (!isEvidenceLayer(layer)) {
    notFound();
  }

  const evidence = await dataSource.getEvidenceLayer(layer);

  if (!evidence) {
    notFound();
  }

  return (
    <>
      <Link className="back-link" href="/evidence">
        {t("← Back to evidence")}
      </Link>

      <PageHeader
        badge={t(stateLabel[evidence.state])}
        description={t(evidence.summary)}
        eyebrow={t(evidence.sourceLabel)}
        title={t(evidence.title)}
      />

      <section className="evidence-metric-grid">
        {evidence.metrics.map((metric) => (
          <article className="metric-card" key={t(metric.label)}>
            <p className="metric-label">{t(metric.label)}</p>
            <p className="evidence-metric-value">{metric.value}</p>
            <p className="metric-detail">{t(metric.detail)}</p>
          </article>
        ))}
      </section>

      <section className="panel-grid evidence-detail-panels">
        <article className="panel">
          <p className="eyebrow">{t("Verified findings")}</p>
          <h2>{t("What the evidence supports")}</h2>
          <ul className="finding-list">
            {evidence.findings.map((finding) => (
              <li key={t(finding)}>{t(finding)}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">{t("Evidence contract")}</p>
          <h2>{t("Source and blocker state")}</h2>
          <dl className="metric-list">
            <div>
              <dt>{t("Source scope")}</dt>
              <dd>{t(evidence.sourceScope)}</dd>
            </div>
            <div>
              <dt>{t("State")}</dt>
              <dd>{t(stateLabel[evidence.state])}</dd>
            </div>
          </dl>

          {evidence.blocker ? (
            <div className="run-lock evidence-blocker">
              <p>{t("Blocker remains open.")}</p>
              <span>{t(evidence.blocker)}</span>
            </div>
          ) : (
            <div className="verified-note">
              <p>{t("This evidence layer is verified for its stated scope.")}</p>
              <span>
                {t("Verification does not imply that separate lifecycle or corporate-action\n                blockers are resolved.")}
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">{t("Artifact identity")}</p>
        <h2>{t("Evidence fingerprint")}</h2>
        {evidence.fingerprint ? (
          <code className="artifact-sha">{evidence.fingerprint}</code>
        ) : (
          <p className="section-copy">{t("No fingerprint is exposed in this mock snapshot.")}</p>
        )}
        <p className="section-copy">
          {t("The web is displaying the research snapshot only. It does not recollect,\n          regenerate, or reinterpret official evidence.")}
        </p>
      </section>
    </>
  );
}
