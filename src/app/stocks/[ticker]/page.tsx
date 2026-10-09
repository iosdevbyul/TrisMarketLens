import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { ChartPlaceholder } from "@/components/stocks/ChartPlaceholder";
import { mockDataSource } from "@/data/MockDataSource";

interface StockDetailPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { ticker } = await params;
  const stock = await mockDataSource.getStock(ticker);

  if (!stock) {
    notFound();
  }

  return (
    <>
      <Link className="back-link" href="/stocks">
        ← Back to stocks
      </Link>

      <PageHeader
        badge="Mock stock detail"
        description={`${stock.ticker} · ${stock.market} · ${stock.sector}`}
        eyebrow="Stock research"
        title={stock.name}
      />

      <section className="stock-detail-grid">
        <article className="panel">
          <p className="eyebrow">Data contract</p>
          <h2>Historical coverage</h2>
          <dl className="metric-list">
            <div>
              <dt>Available from</dt>
              <dd>{stock.availableFrom}</dd>
            </div>
            <div>
              <dt>Latest mock coverage</dt>
              <dd>{stock.latestDataDate}</dd>
            </div>
            <div>
              <dt>Data mode</dt>
              <dd>Mock only</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Evidence</p>
          <h2>Quality and lifecycle</h2>
          <div className="evidence-placeholder">
            <span className="status-pill" data-state="in_progress">
              API pending
            </span>
            <p>{stock.evidenceNote}</p>
          </div>
          <div className="run-lock">
            <p>No inferred quality state.</p>
            <span>
              The UI will not mark this security verified until the backend returns
              authoritative per-security evidence.
            </span>
          </div>
        </article>
      </section>

      <section className="panel single-panel">
        <ChartPlaceholder
          availableFrom={stock.availableFrom}
          latestDataDate={stock.latestDataDate}
          ticker={stock.ticker}
        />
        <p className="chart-note">{stock.chartNote}</p>
      </section>
    </>
  );
}
