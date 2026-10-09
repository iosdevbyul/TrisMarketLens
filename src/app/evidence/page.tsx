import { PageHeader } from "@/components/common/PageHeader";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import { getDataSource } from "@/data/getDataSource";

export default async function EvidencePage() {
  const dataSource = getDataSource();
  const [layers, coverage] = await Promise.all([
    dataSource.getEvidenceLayers(),
    dataSource.getCoverageSummary(),
  ]);

  return (
    <>
      <PageHeader
        badge="Fail closed"
        description="Evidence is treated as an explicit research dependency. Verified market-wide evidence stays distinct from unresolved per-security lifecycle and corporate-action coverage."
        eyebrow="Research integrity"
        title="Evidence"
      />

      <section className="evidence-grid">
        {layers.map((layer) => (
          <EvidenceCard key={layer.id} layer={layer} />
        ))}
      </section>

      <section className="panel single-panel">
        <WakSectionHeader eyebrow="Open blockers" title="What still prevents the baseline freeze" trailing={<WakStatusBadge state="blocked" label="Freeze blocked" />} />

        <div className="blocker-summary-grid">
          <div>
            <span>Unresolved securities</span>
            <strong>{coverage.unresolvedSecurities.toLocaleString()}</strong>
          </div>
          <div>
            <span>Unexplained ticker-sessions</span>
            <strong>{coverage.unexplainedTickerSessions.toLocaleString()}</strong>
          </div>
          <div>
            <span>Historical identity coverage</span>
            <strong>
              {coverage.historicalIdentityVerified}/{coverage.universe}
            </strong>
          </div>
        </div>

        <p className="section-copy">
          The web does not reinterpret these blockers. It mirrors the current
          research evidence state until DonghakStockVision exposes the same data
          through its HTTP API.
        </p>
      </section>
    </>
  );
}
