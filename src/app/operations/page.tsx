import Link from "next/link";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";
import {loadOperationalDateDistribution} from "@/data/OperationalDateDistributionDataSource";
import {summarizeCollectionPreview} from "@/domain/collectionPreviewSummary";
import { getFeatureDataState } from "@/domain/featureDataState";
import { PageHeader } from "@/components/common/PageHeader";
import { getTranslator, getLocale } from "@/i18n/server";
import { getOperations } from "@/data/OperationsDataSource";
import { getSchedulerDiagnostics } from "@/data/KrxSchedulerDiagnosticsDataSource";
import { KrxSchedulerDiagnosticsPanel } from "@/components/operations/KrxSchedulerDiagnosticsPanel";
import type { AnalysisRunState } from "@/domain/operations";
import { PipelineHealthPanel } from "@/components/operations/PipelineHealthPanel";
import { FreshnessPanel } from "@/components/operations/FreshnessPanel";
import { getFreshness } from "@/data/FreshnessDataSource";
import { getOperationalAlerts } from "@/data/OperationalAlertsDataSource";
import { OperationalAlertsPanel } from "@/components/operations/OperationalAlertsPanel";
import { OperationsOverviewPanel } from "@/components/operations/OperationsOverviewPanel";
import { summarizeOperationsOverview } from "@/domain/operationsOverview";

const stateLabels: Record<AnalysisRunState,string> = {
  queued: "Queued", running: "Running", succeeded: "Succeeded", failed: "Failed", blocked: "Blocked", unknown: "Unknown",
};
export default async function OperationsPage() {
  const [t, locale, result, freshness, alerts, scheduler] = await Promise.all([getTranslator(), getLocale(), getOperations(), getFreshness(), getOperationalAlerts(), getSchedulerDiagnostics()]);
  const { snapshot, source, error } = result;
  const operational = process.env.MARKET_LENS_DATA_SOURCE === "http"
    ? await loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL)
    : {data:null,error:"HTTP operational source is not enabled"};
  const collectionSummary=operational.data?summarizeCollectionPreview(operational.data):null;
  const distribution=process.env.MARKET_LENS_DATA_SOURCE==="http"
    ?await loadOperationalDateDistribution(process.env.DONGHAK_API_BASE_URL)
    :{data:null,error:"HTTP operational source is not enabled"};
  const state=getFeatureDataState(source,error,snapshot.runs.length);
  const formatTime = (value: string | null) => value ? new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul",
  }).format(new Date(value)) : "—";
  const lastCompleted = snapshot.runs.filter(run => run.state === "succeeded" && run.finishedAt)
    .sort((a,b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))[0];
  const fields = [
    { label: "Engine connection", value: t(snapshot.connection === "connected" ? "Connected" : snapshot.connection === "degraded" ? "Degraded" : "Not connected"), detail: t("Operations API connection state") },
    { label: "Latest validated market data", value: snapshot.latestDataThrough ?? "—", detail: t("Latest verified market date") },
    { label: "Last recorded successful run", value: formatTime(lastCompleted?.finishedAt ?? null), detail: t("Does not certify acquisition or semantic approval") },
    { label: "Next scheduled operation", value: formatTime(snapshot.nextScheduledRun), detail: t("Scheduler provided timestamp") },
  ];
  return (
    <>
      <PageHeader eyebrow={t("Operations")} title={t("Recorded operations")}
        badge={t(state === "demo" ? "Demo data" : state === "available" ? "API data" : state === "error" ? "Operations unavailable" : state === "empty" ? "No analysis runs available" : "Not connected")}
        description={t("Monitor market data collection, validation, inference and the operational history supplied by DonghakStockVision.")} />
      {source === "mock" ? <div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("The timestamps and run records below are examples, not actual market processing.")}</span></div> : null}
      {error ? <div className="run-lock" role="alert"><p>{t("Operations unavailable")}</p><span>{error}</span></div> : null}
      <section className="panel single-panel" aria-label="Collected market observations">
        <div className="panel-heading"><h2>Collected KRX observations</h2><span className="panel-count">{operational.data ? operational.data.total.toLocaleString() + " observed tickers" : "Unavailable"}</span></div>
        <p className="section-copy">Separate, unreviewed operational SQLite snapshot. This count is not the approved research universe, and collection does not establish market completeness.</p>
        {collectionSummary ? <>
          <div className="operations-overview-grid" aria-label="Collection date summary for returned catalog page">
            <div className="operations-overview-stat"><span>Newest observed date (preview)</span><strong>{collectionSummary.newestDate ?? "—"}</strong></div>
            <div className="operations-overview-stat"><span>Oldest observed date (preview)</span><strong>{collectionSummary.oldestDate ?? "—"}</strong></div>
            <div className="operations-overview-stat"><span>Tickers at newest date (preview)</span><strong>{collectionSummary.matchingNewest} / {collectionSummary.previewCount}</strong></div>
            <div className="operations-overview-stat"><span>Distinct latest dates (preview)</span><strong>{collectionSummary.distinctDates}</strong></div>
          </div>
          <p className="metric-detail">Date comparisons cover only {collectionSummary.previewCount} returned catalog rows of {collectionSummary.observedCount} observed tickers{collectionSummary.isPartial ? "; not a market-wide freshness or missing-data audit." : "; not a missing-data audit."} No live trading calendar or completeness threshold was assumed.</p>
        </> : null}
        {operational.error ? <p className="metric-detail" role="status">Operational catalog: {operational.error}</p> : null}
        {operational.data?.items.length ? <div className="operations-runs" aria-label="Collected KRX ticker preview">
          {operational.data.items.slice(0,5).map(item => <article className="operations-run" key={item.ticker}>
            <div><strong><Link href={"/operational-market/"+item.ticker}>{item.ticker}</Link></strong>
            <p className="metric-detail">Latest observed trading date: {item.latestDataDate}</p></div>
            <span className="status-pill" data-state="in_progress">Unreviewed</span>
          </article>)}
        </div> : operational.data ? <p className="section-copy">The operational snapshot returned no observed tickers.</p> : null}
        <Link href="/operational-market">Browse collected tickers and OHLCV</Link>
      </section>
      <section className="panel single-panel" aria-label="Full operational catalog date distribution">
        <div className="panel-heading"><div><p className="eyebrow">Observed coverage</p><h2>Latest collection date distribution</h2></div><span className="panel-count">{distribution.data ? distribution.data.observedTickers+" catalog tickers" : "Unavailable"}</span></div>
        <p className="section-copy">Counts each ticker once by its latest stored observation date across the complete paginated operational catalog. This is not a trading-calendar gap audit, market-wide listing check, or research validation.</p>
        {distribution.error?<p role="status" className="metric-detail">{distribution.error}</p>:null}
        {distribution.data?<div className="operations-runs">
          <p className="metric-detail">Newest date: {distribution.data.newestDate??"—"} · Oldest latest date: {distribution.data.oldestDate??"—"}</p>
          {distribution.data.latestDates.length===0?<p className="section-copy">No collected tickers in the snapshot.</p>:distribution.data.latestDates.map(item=><div className="operations-run" key={item.date}><strong>{item.date}</strong><span className="metric-detail">{item.count.toLocaleString()} tickers ({(item.count/distribution.data!.observedTickers*100).toFixed(1)}%)</span></div>)}
        </div>:null}
      </section>
      <KrxSchedulerDiagnosticsPanel result={scheduler}/>
      <OperationsOverviewPanel overview={summarizeOperationsOverview(result,freshness,alerts)} locale={locale} demonstration={[result.source,freshness.source,alerts.source].includes("mock")}/>
      <PipelineHealthPanel result={result} locale={locale}/>
      <FreshnessPanel result={freshness} locale={locale}/>
      <OperationalAlertsPanel result={alerts} locale={locale}/>
      <section className="operations-grid" aria-label={t("Analysis operations")}>
        {fields.map(field => <article className="metric-card" key={field.label}>
          <p className="metric-label">{t(field.label)}</p><p className="metric-value operations-value">{field.value}</p>
          <p className="metric-detail">{field.detail}</p>
        </article>)}
      </section>
      <section className="panel single-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">{t("Run history")}</p><h2>{t("Recorded execution history")}</h2></div>
          <span className="panel-count">{snapshot.runs.length} {t("runs")}</span>
        </div>
        {snapshot.runs.length === 0 ? <p className="section-copy">{t(state==="error"?"Operations unavailable":state==="disconnected"?"Not connected":"No recorded operations available")}</p> :
          <div className="operations-runs">{snapshot.runs.map(run => <article className="operations-run" key={run.id}>
            <div><strong>{run.pipeline}</strong><p className="metric-detail">{run.id} · {run.dataThrough ?? "—"}</p></div>
            <div><span className="status-pill" data-state={run.state === "succeeded" ? "verified" : run.state === "running" || run.state === "queued" ? "in_progress" : "blocked"}>{t(stateLabels[run.state])}</span><p className="metric-detail">{formatTime(run.startedAt)}</p></div>
            {run.summary ? <p className="metric-detail operations-run-summary">{t(run.summary)}</p> : null}
          </article>)}</div>}
      </section>
    </>
  );
}
