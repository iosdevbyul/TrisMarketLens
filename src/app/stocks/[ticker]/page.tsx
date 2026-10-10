import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { OhlcvChart } from "@/components/stocks/OhlcvChart";
import { getOhlcv } from "@/data/OhlcvDataSource";
import { getLocale } from "@/i18n/server";
import { getDataSource } from "@/data/getDataSource";
import { getStockAnalysis } from "@/data/StockAnalysisDataSource";
import { getPredictionEvaluations } from "@/data/PredictionEvaluationDataSource";
import { stockDisplayName, stockSectorLabel } from "@/domain/stock";

interface StockDetailPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const { ticker } = await params;
  const [stock, analysis, prices, locale, evaluation] = await Promise.all([dataSource.getStock(ticker), getStockAnalysis(ticker), getOhlcv(ticker), getLocale(), getPredictionEvaluations(ticker)]);

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

      <section className="panel single-panel" aria-label={t("Prediction evaluation")}>
        <div className="panel-heading"><div><p className="eyebrow">{t("Research evaluation")}</p><h2>{t("Prediction evaluation")}</h2></div>
          <span className="panel-count">{evaluation.source === "mock" ? t("Demo data") : evaluation.source === "http" ? t("API data") : t("Not connected")}</span>
        </div>
        <p className="section-copy">{t("Evaluation outcomes are supplied by the research backend, not inferred by the web interface.")}</p>
        {evaluation.source === "mock" ? <div className="run-lock" role="status"><p>{t("Demonstration evaluations")}</p><span>{t("All evaluation prices and returns below are fictional examples.")}</span></div> : null}
        {evaluation.error ? <div className="run-lock" role="alert"><p>{t("Evaluation unavailable")}</p><span>{evaluation.error}</span></div> : null}
        {evaluation.data.evaluations.length === 0 ? <p className="section-copy">{t("No evaluated predictions available.")}</p> :
          <div className="evaluation-list">{evaluation.data.evaluations.map(item => <article className="evaluation-item" key={item.id}>
            <div className="stock-analysis-heading"><div><strong>{item.analysisId}</strong><p className="metric-detail">{item.policyId} · {item.referenceDate}</p></div>
            <span className="status-pill" data-state={item.verdict === "correct" ? "verified" : item.verdict === "incorrect" ? "blocked" : "in_progress"}>{t(({correct:"Correct",incorrect:"Incorrect",inconclusive:"Inconclusive",pending:"Pending"} as const)[item.verdict])}</span></div>
            <dl className="evaluation-metrics">
              {[[t("Horizon"), String(item.horizonSessions)], [t("Reference price"), item.referencePrice?.toLocaleString() ?? "—"], [t("Evaluation price"), item.evaluationPrice?.toLocaleString() ?? "—"], [t("Realized return"), item.realizedReturn === null ? "—" : (item.realizedReturn*100).toFixed(2)+"%"], [t("Evaluation date"), item.evaluationDate ?? "—"]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {item.explanation ? <p className="section-copy">{t(item.explanation)}</p> : null}
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
        <div className="panel-heading"><div><p className="eyebrow">{t("OHLC history")}</p><h2>{t("Price and volume")}</h2></div><span className="panel-count">{prices.source === "mock" ? t("Demo data") : prices.source === "http" ? t("API data") : t("Not connected")}</span></div>
        {prices.source === "mock" ? <div className="run-lock" role="status"><p>{t("Artificial OHLCV demo")}</p><span>{t("Example candles are not historical market prices.")}</span></div> : null}
        {prices.error ? <div className="run-lock" role="alert"><p>{t("Price data unavailable")}</p><span>{prices.error}</span></div> : null}
        {prices.data.bars.length ? <OhlcvChart ticker={ticker} bars={prices.data.bars} locale={locale} analyses={analysis.data.records} analysisIsDemo={analysis.source === "mock"} /> : <p className="section-copy">{t("No validated price bars available yet.")}</p>}
      </section>
    </>
  );
}
