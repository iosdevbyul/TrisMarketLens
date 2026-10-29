import Link from "next/link";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";
import { getFeatureDataState } from "@/domain/featureDataState";
import { PageHeader } from "@/components/common/PageHeader";
import { getTranslator, getLocale } from "@/i18n/server";
import { getOperations } from "@/data/OperationsDataSource";
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
  const [t, locale, result, freshness, alerts] = await Promise.all([getTranslator(), getLocale(), getOperations(), getFreshness(), getOperationalAlerts()]);
  const { snapshot, source, error } = result;
  const operational = process.env.MARKET_LENS_DATA_SOURCE === "http"
    ? await loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL)
    : {data:null,error:"HTTP operational source is not enabled"};
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
        {operational.error ? <p className="metric-detail" role="status">Operational catalog: {operational.error}</p> : null}
        {operational.data?.items.length ? <p className="metric-detail">Sample from the first page: {operational.data.items.slice(0,5).map(item => item.ticker).join(", ")}</p> : null}
        <Link href="/operational-market">Browse collected tickers and OHLCV</Link>
      </section>
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
