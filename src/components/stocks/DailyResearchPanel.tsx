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
export function DailyResearchPanel({ ticker, result, filters }: { ticker: string; result: DailyResearchResult; filters: DailyResearchFilters }) {
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
    <div className="panel-heading"><div><p className="eyebrow">Daily AI research</p><h2>Retained model research history</h2></div>
      <span className="panel-count">{result.source === "disconnected" ? "Not connected" : result.error ? "Unavailable" : data?.records.length ? "Research records" : "No recorded analysis"}</span></div>
    <p className="section-copy">Uncalibrated conditional research scores and display-only Up/Down/Neutral signals. These are not probabilities of a price increase, approved forward predictions, investment recommendations or trading instructions. Local analysis timestamps are not independently authenticated.</p>
    <form action={"/stocks/" + encodeURIComponent(ticker)} method="get" className="stock-analysis-stats" aria-label="Daily research filters">
      <div><label htmlFor="research-date">Trading date</label><input id="research-date" type="date" name="tradingDate" defaultValue={filters.tradingDate ?? ""} /></div>
      <div><label htmlFor="research-from">From (range)</label><input id="research-from" type="date" name="fromDate" defaultValue={filters.fromDate ?? ""} /></div>
      <div><label htmlFor="research-to">To (range)</label><input id="research-to" type="date" name="toDate" defaultValue={filters.toDate ?? ""} /></div>
      <div><label htmlFor="research-limit">Page size</label><select id="research-limit" name="limit" defaultValue={String(limit)}>{[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      <div><button type="submit">Filter research</button> <Link href={"/stocks/" + encodeURIComponent(ticker) + "#daily-research"}>Clear</Link></div>
    </form>
    <p className="metric-detail">Use either an exact trading date or a date range. Filters are inclusive and independent of the approved publication above.</p>
    {result.error ? <div className="run-lock" role="alert"><p>{result.unavailable ? "Operational research snapshot not configured" : "Research data unavailable"}</p><span>{result.error}. No demonstration records have been substituted.</span></div> : null}
    {!result.error && result.source === "disconnected" ? <p className="section-copy">Set MARKET_LENS_DAILY_RESEARCH_SOURCE=http to enable this independent read-only research API.</p> : null}
    {data ? <>
      <p className="section-copy">Last successful analysis: {data.lastSuccessfulAnalyzedAt ?? "None"} · Trading date: {data.lastSuccessfulTradingDate ?? "None"} · Origin: {data.lastSuccessfulDataOrigin === "synthetic_fixture" ? "SYNTHETIC FIXTURE" : data.lastSuccessfulDataOrigin === "real" ? "Real provider capture (locally retained; not independently authenticated)" : "None"}.</p>
      {summary ? <section aria-label="Visible daily research evidence summary">
        <div className="panel-heading"><h2>Research activity in this page</h2><span className="panel-count">Visible records only</span></div>
        <p className="section-copy">Counts below describe only the {summary.displayed} records in this current paginated response, not all {data?.totalRecords ?? 0} retained records. A status of completed means the research job produced an artifact, not that its forecast was correct or independently verified.</p>
        <div className="operations-overview-grid">
          {([
            ["Completed", summary.completed], ["Pending", summary.pending], ["Blocked", summary.blocked],
            ["Failed", summary.failed], ["Real-source records", summary.real], ["Synthetic fixtures", summary.synthetic],
            ["Distinct model versions", summary.distinctModels], ["Records with a score", summary.withScore],
          ] as const).map(([label, value]) => <div className="operations-overview-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
        <div className="panel-heading"><h2>Recorded research status by trading date</h2><span className="panel-count">{summary.observedDates.length} dates in page</span></div>
        {summary.observedDates.length ? <div className="stock-analysis-list">
          {summary.observedDates.map((date) => <div className="status-row" key={date.date}>
            <div><p className="status-title">{date.date}</p><p className="status-detail">Completed: {date.completed} · Pending, blocked or failed: {date.unresolved}</p></div>
            <div aria-hidden="true" style={{display:"flex",width:"min(240px, 40%)",height:"12px",gap:"2px"}}>
              <span style={{flex:date.completed || 0,background:"var(--accent)",minWidth:date.completed ? 2 : 0}} />
              <span style={{flex:date.unresolved || 0,background:"var(--warning)",minWidth:date.unresolved ? 2 : 0}} />
            </div>
          </div>)}
        </div> : <p className="section-copy">No displayed dates.</p>}
        <p className="metric-detail">Within completed records only, the displayed research labels are Up: {summary.directionUp}, Down: {summary.directionDown}, Neutral: {summary.directionNeutral}. These are descriptive output labels, not accuracy or return statistics.</p>
      </section> : null}
      {data.records.length === 0 ? <p role="status" className="section-copy">No retained daily research records match this selection. This does not mean analysis succeeded.</p> : <div className="stock-analysis-list">{data.records.map((record, index) => <article className="stock-analysis-item" key={record.jobReference}>
        <div className="stock-analysis-heading"><div><strong>{record.tradingDate} · {record.modelId}</strong><p className="metric-detail">{record.modelVersion} · {record.dataOrigin === "synthetic_fixture" ? "SYNTHETIC FIXTURE · NOT LIVE" : "REAL PROVIDER RECORD · LOCAL EVIDENCE ONLY"}</p></div>
          <span className="status-pill" data-state={record.status === "completed" ? "verified" : record.status === "pending" ? "in_progress" : "blocked"}>{record.status === "completed" ? "Research completed (not approved)" : record.status}</span></div>
        <dl className="stock-analysis-stats">{details(record).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <details><summary>Public source references ({record.sources.length})</summary><ul>{record.sources.map((s, i) => <li key={s.referenceId + i}>{s.tradingDate} · {s.origin === "authorized_provider_mock_fixture" ? "Synthetic fixture" : "Real provider capture"} · {s.referenceId}</li>)}</ul></details>
        {index === 0 ? <p className="metric-detail">Most recent retained research entry (not necessarily the latest successful run).</p> : null}
      </article>)}</div>}
      <div className="stock-analysis-heading"><span>Showing {data.records.length} of {data.totalRecords} · Offset {offset}</span><div>
        {offset > 0 ? <Link href={pageUrl(Math.max(0, offset - limit))}>Previous</Link> : null}
        {" "}
        {offset + data.records.length < data.totalRecords ? <Link href={pageUrl(offset + limit)}>Next</Link> : null}
      </div></div>
    </> : null}
  </section>;
}
