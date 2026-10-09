import { PageHeader } from "@/components/common/PageHeader";
import { StockExplorer } from "@/components/stocks/StockExplorer";
import { getDataSource } from "@/data/getDataSource";

export default async function StocksPage() {
  const dataSource = getDataSource();
  const [coverage, stocks] = await Promise.all([
    dataSource.getCoverageSummary(),
    dataSource.getStocks(),
  ]);

  return (
    <>
      <PageHeader
        badge="Typed data source"
        description="Search the currently selected research data source. HTTP mode reads the reviewed DonghakStockVision snapshot without recreating research logic in the frontend."
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
            <h2>Browse the current research universe</h2>
          </div>
          <span className="panel-count">DataSource</span>
        </div>
        <StockExplorer stocks={stocks} />
      </section>
    </>
  );
}
