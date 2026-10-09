import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { ChartPlaceholder } from "@/components/stocks/ChartPlaceholder";
import { getDataSource } from "@/data/getDataSource";
import { stockDisplayName, stockSectorLabel } from "@/domain/stock";

interface StockDetailPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const dataSource = getDataSource();
  const { ticker } = await params;
  const stock = await dataSource.getStock(ticker);

  if (!stock) {
    notFound();
  }

  return (
    <>
      <Link className="back-link" href="/stocks">
        ← Back to stocks
      </Link>

      <PageHeader
        badge={stock.dataStatus === "mock" ? "Mock stock detail" : "API stock detail"}
        description={`${stock.ticker} · ${stock.market} · ${stockSectorLabel(stock)}`}
        eyebrow="Stock research"
        title={stockDisplayName(stock)}
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
              <dt>Latest coverage</dt>
              <dd>{stock.latestDataDate}</dd>
            </div>
            <div>
              <dt>Data mode</dt>
              <dd>{stock.dataStatus === "mock" ? "Mock only" : "DonghakStockVision API"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Evidence</p>
          <h2>Quality and lifecycle</h2>
          <div className="evidence-placeholder">
            <span className="status-pill" data-state="in_progress">
              Evidence limited
            </span>
            <p>{stock.evidenceNote}</p>
          </div>
          <div className="run-lock">
            <p>No inferred quality state.</p>
            <span>
              The UI only presents evidence returned by DonghakStockVision and does not
              infer lifecycle state from missing bars.
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
