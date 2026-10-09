import { PageHeader } from "@/components/common/PageHeader";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { mockDataSource } from "@/data/MockDataSource";

export default async function EvidencePage() {
  const [layers, coverage] = await Promise.all([
    mockDataSource.getEvidenceLayers(),
    mockDataSource.getCoverageSummary(),
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
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Open blockers</p>
            <h2>What still prevents the baseline freeze</h2>
          </div>
          <span className="status-pill" data-state="blocked">
            Freeze blocked
          </span>
        </div>

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
