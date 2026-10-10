import { getTranslator } from "@/i18n/server";
import { PageHeader } from "@/components/common/PageHeader";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import { getDataSource } from "@/data/getDataSource";

export default async function EvidencePage() {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const [layers, coverage] = await Promise.all([
    dataSource.getEvidenceLayers(),
    dataSource.getCoverageSummary(),
  ]);

  return (
    <>
      <PageHeader
        badge={t("Fail closed")}
        description={t("Evidence is treated as an explicit research dependency. Verified market-wide evidence stays distinct from unresolved per-security lifecycle and corporate-action coverage.")}
        eyebrow={t("Research integrity")}
        title={t("Evidence")}
      />

      <section className="evidence-grid">
        {layers.map((layer) => (
          <EvidenceCard key={layer.id} layer={layer} />
        ))}
      </section>

      <WakPanel as="section" className="single-panel">
        <WakSectionHeader eyebrow={t("Open blockers")} title={t("What still prevents the baseline freeze")} trailing={<WakStatusBadge state="blocked" label={t("Freeze blocked")} />} />

        <div className="blocker-summary-grid">
          <div>
            <span>{t("Unresolved securities")}</span>
            <strong>{coverage.unresolvedSecurities.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t("Unexplained ticker-sessions")}</span>
            <strong>{coverage.unexplainedTickerSessions.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t("Historical identity coverage")}</span>
            <strong>
              {coverage.historicalIdentityVerified}/{coverage.universe}
            </strong>
          </div>
        </div>

        <p className="section-copy">
          {t("The web does not reinterpret these blockers. It mirrors the current\n          research evidence state until DonghakStockVision exposes the same data\n          through its HTTP API.")}
        </p>
      </WakPanel>
    </>
  );
}
