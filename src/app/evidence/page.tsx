import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { mockDataSource } from "@/data/MockDataSource";

export default async function EvidencePage() {
  const [status, coverage] = await Promise.all([
    mockDataSource.getProjectStatus(),
    mockDataSource.getCoverageSummary(),
  ]);

  return (
    <>
      <PageHeader
        badge="Fail closed"
        description="Evidence stays visible as an explicit research dependency. Unknown lifecycle or corporate-action states are not silently converted into valid trading data."
        eyebrow="Research integrity"
        title="Evidence"
      />

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Verification</p>
              <h2>Evidence layers</h2>
            </div>
          </div>
          <StatusList items={status.evidence} />
        </article>

        <article className="panel">
          <p className="eyebrow">Open blockers</p>
          <h2>Security lifecycle</h2>
          <dl className="metric-list blocker-list">
            <div>
              <dt>Unresolved securities</dt>
              <dd>{coverage.unresolvedSecurities.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Unexplained ticker-sessions</dt>
              <dd>{coverage.unexplainedTickerSessions.toLocaleString()}</dd>
            </div>
          </dl>
          <p className="section-copy">
            These values remain blockers until official lifecycle evidence explains
            each missing security session.
          </p>
        </article>
      </section>
    </>
  );
}
