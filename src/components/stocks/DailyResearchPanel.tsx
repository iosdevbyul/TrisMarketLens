import { Localize } from "@/i18n/Localize";
import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import type { DailyResearchResult } from "@/data/DailyResearchDataSource";
import type { DailyResearchFilters } from "@/data/DailyResearchDataSource";
import type { DailyResearchRecord } from "@/domain/dailyResearch";
import { summarizeDailyResearchPage } from "@/domain/dailyResearchPageSummary";

function details(record: DailyResearchRecord) {
  return [
    ["Trading date", record.tradingDate], ["Executed at", record.analyzedAt ?? "No recorded execution"],
    ["Model", record.modelId + " · " + record.modelVersion],
    ["Research score (not a probability)", record.researchScore === null ? "Unavailable" : record.researchScore.toFixed(4)],
    ["Research signal (not a forecast)", record.researchSignal],
    ["Research context", record.researchContext ?? "Unavailable"],
    ["Input window (requested)", record.requestedPeriod.start + " – " + record.requestedPeriod.end],
    ["Observed window", record.observedPeriod ? record.observedPeriod.start + " – " + record.observedPeriod.end : "Unavailable"],
    ["Input fingerprint (selected job universe)", record.inputFingerprint],
    ["Job reference", record.jobReference],
    ["Analysis ID", record.analysisId ?? "Unavailable"],
    ["Attempt", record.attempt === null ? "Not started" : String(record.attempt)],
    ["Reason", record.reasonCode ?? "None"],
    ["Usage", record.usageRestriction],
  ];
}
export async function DailyResearchPanel({ ticker, result, filters }: { ticker: string; result: DailyResearchResult; filters: DailyResearchFilters }) {
  const t = await getTranslator();
  const data = result.data;
  const summary = data ? summarizeDailyResearchPage(data.records) : null;
  const limit = data?.limit ?? filters.limit ?? 50;
  const offset = data?.offset ?? filters.offset ?? 0;
  const pageUrl = (nextOffset: number) => {
    const params = new URLSearchParams();
    if (filters.tradingDate) params.set("tradingDate", filters.tradingDate);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);
    params.set("limit", String(limit));
    params.set("offset", String(nextOffset));
    return "/stocks/" + encodeURIComponent(ticker) + "?" + params.toString() + "#daily-research";
  };
  return <section id="daily-research" className="panel single-panel stock-analysis-panel" aria-label="Daily AI research">
    <div className="panel-heading"><div><p className="eyebrow"><Localize text="Daily AI research" /></p><h2><Localize text="Retained model research history" /></h2></div>
      <span className="panel-count">{t(result.source === "disconnected" ? "Not connected" : result.error ? "Unavailable" : data?.records.length ? "Research records" : "No recorded analysis")}</span></div>
    <p className="section-copy"><Localize text="Uncalibrated conditional research scores and display-only Up/Down/Neutral signals. These are not probabilities of a price increase, approved forward predictions, investment recommendations or trading instructions. Local analysis timestamps are not independently authenticated." /></p>
    <form action={"/stocks/" + encodeURIComponent(ticker)} method="get" className="stock-analysis-stats" aria-label="Daily research filters">
      <div><label htmlFor="research-date"><Localize text="Trading date" /></label><input id="research-date" type="date" name="tradingDate" defaultValue={filters.tradingDate ?? ""} /></div>
      <div><label htmlFor="research-from"><Localize text="From (range)" /></label><input id="research-from" type="date" name="fromDate" defaultValue={filters.fromDate ?? ""} /></div>
      <div><label htmlFor="research-to"><Localize text="To (range)" /></label><input id="research-to" type="date" name="toDate" defaultValue={filters.toDate ?? ""} /></div>
      <div><label htmlFor="research-limit"><Localize text="Page size" /></label><select id="research-limit" name="limit" defaultValue={String(limit)}>{[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      <div><button type="submit"><Localize text="Filter research" /></button> <Link href={"/stocks/" + encodeURIComponent(ticker) + "#daily-research"}><Localize text="Clear" /></Link></div>
    </form>
    <p className="metric-detail"><Localize text="Use either an exact trading date or a date range. Filters are inclusive and independent of the approved publication above." /></p>
    {result.error ? <div className="run-lock" role="alert"><p>{t(result.unavailable ? "Operational research snapshot not configured" : "Research data unavailable")}</p><span>{result.error}. {t("No demonstration records have been substituted.")}</span></div> : null}
    {!result.error && result.source === "disconnected" ? <p className="section-copy">{t("Set MARKET_LENS_DAILY_RESEARCH_SOURCE=http to enable this independent read-only research API.")}</p> : null}
    {data ? <>
      <p className="section-copy">{t("Last successful analysis:")} {data.lastSuccessfulAnalyzedAt ?? t("None")} · {t("Trading date:")} {data.lastSuccessfulTradingDate ?? t("None")} · {t("Origin:")} {t(data.lastSuccessfulDataOrigin === "synthetic_fixture" ? "SYNTHETIC FIXTURE" : data.lastSuccessfulDataOrigin === "real" ? "Real provider capture (locally retained; not independently authenticated)" : "None")}.</p>
      {summary ? <section aria-label="Visible daily research evidence summary">
        <div className="panel-heading"><h2><Localize text="Research activity in this page" /></h2><span className="panel-count"><Localize text="Visible records only" /></span></div>
        <p className="section-copy">{t("Counts below describe only the current paginated response, not the full retained dataset.")} {summary.displayed} / {data?.totalRecords ?? 0}. {t("A completed research job means an artifact was produced; forecast correctness and independent verification are not established.")}</p>
        <div className="operations-overview-grid">
          {([
            ["Completed", summary.completed], ["Pending", summary.pending], ["Blocked", summary.blocked],
            ["Failed", summary.failed], ["Real-source records", summary.real], ["Synthetic fixtures", summary.synthetic],
            ["Distinct model versions", summary.distinctModels], ["Records with a score", summary.withScore],
          ] as const).map(([label, value]) => <div className="operations-overview-stat" key={label}><span>{t(label)}</span><strong>{value}</strong></div>)}
        </div>
        <div className="panel-heading"><h2><Localize text="Recorded research status by trading date" /></h2><span className="panel-count">{summary.observedDates.length} {t("dates in page")}</span></div>
        {summary.observedDates.length ? <div className="stock-analysis-list">
          {summary.observedDates.map((date) => <div className="status-row" key={date.date}>
            <div><p className="status-title">{date.date}</p><p className="status-detail">{t("Completed:")} {date.completed} · {t("Pending, blocked or failed:")} {date.unresolved}</p></div>
            <div aria-hidden="true" style={{display:"flex",width:"min(240px, 40%)",height:"12px",gap:"2px"}}>
              <span style={{flex:date.completed || 0,background:"var(--accent)",minWidth:date.completed ? 2 : 0}} />
              <span style={{flex:date.unresolved || 0,background:"var(--warning)",minWidth:date.unresolved ? 2 : 0}} />
            </div>
          </div>)}
        </div> : <p className="section-copy"><Localize text="No displayed dates." /></p>}
        <p className="metric-detail">{t("Completed research labels (descriptive, not accuracy or return statistics):")} {t("Up:")} {summary.directionUp}, {t("Down:")} {summary.directionDown}, {t("Neutral:")} {summary.directionNeutral}.</p>
      </section> : null}
      {data.records.length === 0 ? <p role="status" className="section-copy"><Localize text="No retained daily research records match this selection. This does not mean analysis succeeded." /></p> : <div className="stock-analysis-list">{data.records.map((record, index) => <article className="stock-analysis-item" key={record.jobReference}>
        <div className="stock-analysis-heading"><div><strong>{record.tradingDate} · {record.modelId}</strong><p className="metric-detail">{record.modelVersion} · {t(record.dataOrigin === "synthetic_fixture" ? "SYNTHETIC FIXTURE · NOT LIVE" : "REAL PROVIDER RECORD · LOCAL EVIDENCE ONLY")}</p></div>
          <span className="status-pill" data-state={record.status === "completed" ? "verified" : record.status === "pending" ? "in_progress" : "blocked"}>{t(record.status === "completed" ? "Research completed (not approved)" : record.status)}</span></div>
        <dl className="stock-analysis-stats">{details(record).map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl>
        <details><summary>{t("Public source references")} ({record.sources.length})</summary><ul>{record.sources.map((s, i) => <li key={s.referenceId + i}>{s.tradingDate} · {t(s.origin === "authorized_provider_mock_fixture" ? "Synthetic fixture" : "Real provider capture")} · {s.referenceId}</li>)}</ul></details>
        {index === 0 ? <p className="metric-detail"><Localize text="Most recent retained research entry (not necessarily the latest successful run)." /></p> : null}
      </article>)}</div>}
      <div className="stock-analysis-heading"><span>{t("Showing")} {data.records.length} / {data.totalRecords} · {t("Offset")} {offset}</span><div>
        {offset > 0 ? <Link href={pageUrl(Math.max(0, offset - limit))}><Localize text="Previous" /></Link> : null}
        {" "}
        {offset + data.records.length < data.totalRecords ? <Link href={pageUrl(offset + limit)}><Localize text="Next" /></Link> : null}
      </div></div>
    </> : null}
  </section>;
}
