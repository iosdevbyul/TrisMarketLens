import { PageHeader } from "@/components/common/PageHeader";
import { StockExplorer } from "@/components/stocks/StockExplorer";
import { mockDataSource } from "@/data/MockDataSource";

export default async function StocksPage() {
  const [coverage, stocks] = await Promise.all([
    mockDataSource.getCoverageSummary(),
    mockDataSource.getStocks(),
  ]);

  return (
    <>
      <PageHeader
        badge="Mock explorer"
        description="Search the initial stock explorer shell now. Real ticker coverage, OHLC history, features, and evidence will arrive through the DonghakStockVision HTTP API."
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
          <p className="metric-label">Open lifecycle cases</p>
          <p className="metric-value">{coverage.unresolvedSecurities}</p>
          <p className="metric-detail">
            {coverage.unexplainedTickerSessions.toLocaleString()} unexplained sessions
          </p>
        </article>
      </section>

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Stock explorer</p>
            <h2>Browse the future API surface</h2>
          </div>
          <span className="panel-count">Mock only</span>
        </div>
        <StockExplorer stocks={stocks} />
      </section>
    </>
  );
}
