import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { ChartPlaceholder } from "@/components/stocks/ChartPlaceholder";
import { getDataSource } from "@/data/getDataSource";
import { getStockAnalysis } from "@/data/StockAnalysisDataSource";
import { stockDisplayName, stockSectorLabel } from "@/domain/stock";

interface StockDetailPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const { ticker } = await params;
  const [stock, analysis] = await Promise.all([dataSource.getStock(ticker), getStockAnalysis(ticker)]);

  if (!stock) {
    notFound();
  }

  return (
    <>
      <Link className="back-link" href="/stocks">
        {t("← Back to stocks")}
      </Link>

      <PageHeader
        badge={stock.dataStatus === "mock" ? "Mock stock detail" : "API stock detail"}
        description={`${stock.ticker} · ${stock.market} · ${stockSectorLabel(stock)}`}
        eyebrow={t("Stock research")}
        title={stockDisplayName(stock)}
      />

      <section className="panel single-panel stock-analysis-panel" aria-label={t("AI analysis")}>
        <div className="panel-heading">
          <div><p className="eyebrow">{t("AI analysis")}</p><h2>{t("Model analysis history")}</h2></div>
          <span className="panel-count">{analysis.source === "mock" ? t("Demo data") : analysis.source === "http" ? t("API data") : t("Not connected")}</span>
        </div>
        {analysis.source === "mock" ? <div className="run-lock" role="status"><p>{t("Demonstration predictions")}</p><span>{t("These scores are examples and must not be used for investment decisions.")}</span></div> : null}
        {analysis.error ? <div className="run-lock" role="alert"><p>{t("Analysis unavailable")}</p><span>{analysis.error}</span></div> : null}
        {analysis.data.records.length === 0 ? <p className="section-copy">{t("No verified model analysis is available for this ticker.")}</p> :
          <div className="stock-analysis-list">{analysis.data.records.map(record => <article className="stock-analysis-item" key={record.id}>
            <div className="stock-analysis-heading">
              <div><strong>{record.modelId}</strong><p className="metric-detail">{record.modelVersion} · {record.dataThrough}</p></div>
              <span className="status-pill" data-state={record.validation === "verified" ? "verified" : record.validation === "blocked" ? "blocked" : "in_progress"}>{t(record.validation === "verified" ? "Verified" : record.validation === "blocked" ? "Blocked" : "In progress")}</span>
            </div>
            <dl className="stock-analysis-stats">
              <div><dt>{t("Direction")}</dt><dd>{t(record.direction === "up" ? "Up" : record.direction === "down" ? "Down" : "Neutral")}</dd></div>
              <div><dt>{t("Model score")}</dt><dd>{record.score === null ? "—" : record.score.toFixed(4)}</dd></div>
              <div><dt>{t("Analyzed at")}</dt><dd>{record.analyzedAt}</dd></div>
            </dl>
            {record.explanation ? <p className="section-copy">{t(record.explanation)}</p> : null}
          </article>)}</div>}
      </section>

      <section className="stock-detail-grid">
        <article className="panel">
          <p className="eyebrow">{t("Data contract")}</p>
          <h2>{t("Historical coverage")}</h2>
          <dl className="metric-list">
            <div>
              <dt>{t("Available from")}</dt>
              <dd>{stock.availableFrom}</dd>
            </div>
            <div>
              <dt>{t("Latest coverage")}</dt>
              <dd>{stock.latestDataDate}</dd>
            </div>
            <div>
              <dt>{t("Data mode")}</dt>
              <dd>{stock.dataStatus === "mock" ? "Mock only" : "DonghakStockVision API"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">{t("Evidence")}</p>
          <h2>{t("Quality and lifecycle")}</h2>
          <div className="evidence-placeholder">
            <span className="status-pill" data-state="in_progress">
              {t("Evidence limited")}
            </span>
            <p>{t(stock.evidenceNote)}</p>
          </div>
          <div className="run-lock">
            <p>{t("No inferred quality state.")}</p>
            <span>
              {t("The UI only presents evidence returned by DonghakStockVision and does not\n              infer lifecycle state from missing bars.")}
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
        <p className="chart-note">{t(stock.chartNote)}</p>
      </section>
    </>
  );
}
