import { PageHeader } from "@/components/common/PageHeader";
import { mockDataSource } from "@/data/MockDataSource";

export default async function StocksPage() {
  const coverage = await mockDataSource.getCoverageSummary();

  return (
    <>
      <PageHeader
        badge="Coverage snapshot"
        description="The stock explorer will use the same typed data boundary as the research dashboard. For now this page exposes dataset coverage without pretending that a live API exists."
        eyebrow="Market"
        title="Stocks"
      />

      <section className="metric-grid">
        <article className="metric-card">
          <p className="metric-label">Universe</p>
          <p className="metric-value">{coverage.universe.toLocaleString()}</p>
          <p className="metric-detail">Approved KOSPI securities</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Daily bars</p>
          <p className="metric-value">{coverage.totalBars.toLocaleString()}</p>
          <p className="metric-detail">
            {coverage.startDate} through {coverage.endDate}
          </p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Current identity</p>
          <p className="metric-value">
            {coverage.currentIdentityVerified}/{coverage.universe}
          </p>
          <p className="metric-detail">Official current corporation mapping</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Historical identity</p>
          <p className="metric-value">
            {coverage.historicalIdentityVerified}/{coverage.universe}
          </p>
          <p className="metric-detail">Full-period identity continuity verified</p>
        </article>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">Next integration</p>
        <h2>Stock explorer is API-gated</h2>
        <p className="section-copy">
          Ticker search, OHLC history, feature inspection, and per-security quality
          evidence will be connected after the DonghakStockVision HTTP API contract is
          available.
        </p>
      </section>
    </>
  );
}
