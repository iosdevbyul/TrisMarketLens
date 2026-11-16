import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { checkBackendHealth } from "@/data/backendHealth";
import { getAIManagementSnapshot } from "@/data/AIModelManagementDataSource";
import { getDailyResearch } from "@/data/DailyResearchDataSource";
import { researchSourceRows } from "@/domain/researchSourceStatus";
import { researchDiagnosticActions } from "@/domain/researchDiagnosticActions";
import { summarizeResearchWorkspace } from "@/domain/researchWorkspaceSummary";

export const dynamic = "force-dynamic";

export default async function ResearchStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string }>;
}) {
  const query = await searchParams;
  const entered = typeof query.ticker === "string" ? query.ticker.trim().toUpperCase() : "";
  const validTicker = /^[0-9A-Z]{6}$/.test(entered);
  const ticker = validTicker ? entered : null;
  const sourceMode = process.env.MARKET_LENS_DATA_SOURCE ?? "mock";

  const [health, management, daily] = await Promise.all([
    sourceMode === "http" ? checkBackendHealth(process.env.DONGHAK_API_BASE_URL) : Promise.resolve(null),
    getAIManagementSnapshot(),
    ticker ? getDailyResearch(ticker, { limit: 10, offset: 0 }) : Promise.resolve(null),
  ]);

  const sources = researchSourceRows({ sourceMode, health, management, daily, ticker });
  const workspace = summarizeResearchWorkspace(sources, management, daily);
  const nextChecks = researchDiagnosticActions(sources);
  const recentRecords = daily?.source === "http" && !daily.error ? daily.data?.records ?? [] : [];
  return (
    <>
      <PageHeader
        eyebrow="Research infrastructure"
        title="Integrated AI research status"
        badge={workspace.overview === "observed" ? "Published source observations" : workspace.overview === "demo" ? "Demonstration / not live" : "Not fully verified"}
        description="Separate live API reachability, authenticated research LLM controls, recorded comparison evidence and ticker-level daily research. Each publication is checked independently."
      />
      <section className="panel single-panel" aria-label="Source selection">
        <div className="panel-heading"><h2>Choose a security to check daily research</h2><span className="panel-count">Read-only checks</span></div>
        <form action="/research-status" method="get">
          <label htmlFor="research-status-ticker">Ticker</label>{" "}
          <input id="research-status-ticker" name="ticker" defaultValue={entered} maxLength={6} pattern="[0-9A-Za-z]{6}" placeholder="005930" />{" "}
          <button type="submit">Inspect sources</button>{" "}
          <Link href="/research-status">Clear</Link>
        </form>
        {entered && !ticker ? <p role="alert" className="metric-detail">Use exactly six letters or digits. No per-ticker API request was made.</p> : null}
        <p className="section-copy">Market source mode: {sourceMode}. Management credentials are server-only; this screen never initiates validation, model selection, autonomous learning, or trades.</p>
      </section>
      <section className="panel single-panel" aria-label="Independent research source status">
        <div className="panel-heading"><h2>Research publication and connectivity</h2><span className="panel-count">{sources.length} independent checks</span></div>
        <div className="status-list">
          {sources.map((item) => (
            <article className="status-row" key={item.id}>
              <div>
                <p className="status-title"><Link href={item.href}>{item.name}</Link></p>
                <p className="status-detail">{item.detail}</p>
                {item.count !== null ? <p className="metric-detail">Published count: {item.count}</p> : null}
              </div>
              <span className="status-pill" data-state={item.status === "available" ? "verified" : item.status === "unavailable" ? "blocked" : "in_progress"}>{item.status}</span>
            </article>
          ))}
        </div>
        <p className="section-copy">Empty means a valid response with no published records. Unavailable indicates a failed or unverified source. Demo and disconnected are not equivalent to real backend availability.</p>
      </section>
      <section className="panel single-panel" aria-label="Research LLM selection and comparison overview">
        <div className="panel-heading"><div><p className="eyebrow">Research agent</p><h2>Model selection and experiment comparisons</h2></div><span className="panel-count">{management.state}</span></div>
        <p className="section-copy">These are actual authenticated management records when configured. Selecting a research LLM does not start a study or change a stock-direction prediction model.</p>
        <div className="operations-overview-grid">
          {([
            ["Selected research LLM", workspace.selectedModelKey ?? "Unreported"],
            ["Default research LLM", workspace.defaultModelKey ?? "Unreported"],
            ["Last applied to research", workspace.lastAppliedModelKey ?? "No recorded application"],
            ["Selection version", workspace.selectionVersion ?? "Unknown"],
            ["Management busy", workspace.modelBusy === null ? "Unknown" : workspace.modelBusy ? "Yes" : "No"],
            ["Reported comparison contracts", workspace.comparisonContracts ?? "Unavailable"],
            ["Contracts with 2+ entries", workspace.matchedContracts ?? "Unavailable"],
            ["Comparisons lacking contract", workspace.unclassifiedComparisons ?? "Unavailable"],
          ] as const).map(([label, value]) => <div className="operations-overview-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
        <p className="metric-detail">Only identical backend-provided comparisonContractId values can be inspected together. Two retained entries are not proof of independent performance or stock-price accuracy.</p>
        <p><Link href="/ai-research-models">Review model catalog, validation controls and matching research runs</Link></p>
      </section>
      <section className="panel single-panel" aria-label="Selected ticker research preview">
        <div className="panel-heading"><div><p className="eyebrow">Daily retained research</p><h2>{ticker ? ticker + " publication preview" : "Choose a ticker for a publication preview"}</h2></div>
          <span className="panel-count">{workspace.totalResearchRecords === null ? "Not available" : workspace.totalResearchRecords + " published total"}</span></div>
        <p className="section-copy">This is a bounded preview of up to 10 validated records, not an all-history dataset. A completed research job or a displayed Up/Down label is neither an approved forecast nor a measured return.</p>
        <div className="operations-overview-grid">
          {([
            ["Records in preview", workspace.previewRecords ?? "Unknown"],
            ["Completed", workspace.previewCompleted ?? "Unknown"],
            ["Pending", workspace.previewPending ?? "Unknown"],
            ["Blocked", workspace.previewBlocked ?? "Unknown"],
            ["Failed", workspace.previewFailed ?? "Unknown"],
            ["Real-origin records", workspace.previewReal ?? "Unknown"],
            ["Synthetic fixtures", workspace.previewSynthetic ?? "Unknown"],
            ["Model versions observed", workspace.previewDistinctModels ?? "Unknown"],
          ] as const).map(([label, value]) => <div className="operations-overview-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
        {recentRecords.length ? <div className="stock-table" style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={{ width: "100%", minWidth: "690px", borderCollapse: "collapse", textAlign: "left" }}>
            <thead><tr>{["Trading date", "Research model", "Execution status", "Data origin", "Recorded signal"].map(heading =>
              <th scope="col" key={heading} style={{ borderBottom: "1px solid var(--border)", padding: "10px" }}>{heading}</th>)}</tr></thead>
            <tbody>{recentRecords.map(record => <tr key={record.jobReference}>
              <td style={{ padding: "10px" }}>{record.tradingDate}</td>
              <td style={{ padding: "10px" }}>{record.modelId} · {record.modelVersion}</td>
              <td style={{ padding: "10px" }}>{record.status}</td>
              <td style={{ padding: "10px" }}>{record.dataOrigin === "real" ? "Real source" : "Synthetic fixture"}</td>
              <td style={{ padding: "10px" }}>{record.researchSignal}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="section-copy" role="status">{!ticker ? "Enter a ticker above to request a real publication preview." : daily?.error ?? "No records were returned in the preview. This does not prove that an experiment was run."}</p>}
        {ticker ? <p><Link href={"/stocks/" + ticker + "#daily-research"}>Inspect full per-ticker record details</Link> · <Link href={"/stocks/" + ticker + "/research-comparison"}>Compare up to 1,000 published records</Link></p> : null}
      </section>
      <section className="panel single-panel" aria-label="Research source next verification steps">
        <div className="panel-heading"><h2>Next verification steps</h2><span className="panel-count">{nextChecks.length} suggested checks</span></div>
        {nextChecks.length ? <ol>
          {nextChecks.map(action => <li key={action.id}>
            <strong>{action.title}</strong>
            <p className="metric-detail">{action.description}</p>
            <p><Link href={action.href}>Inspect source evidence</Link></p>
          </li>)}
        </ol> : <p className="section-copy">No current connection blockers were identified by these bounded checks. This is not an assertion of research quality or publication completeness.</p>}
        <p className="section-copy">For the owner-operated Mac backend, run <code>npm run verify:research:workspace</code> from the web repository with pre-existing local configuration to check the live read-only contract. No verifier runs from this page.</p>
      </section>
      <section className="panel single-panel" aria-label="Research scope and limitations">
        <div className="panel-heading"><h2>Research evidence boundaries</h2><span className="panel-count">No automatic approval</span></div>
        <div className="operations-overview-grid">
          <div className="operations-overview-stat"><span>Registered research LLMs</span><strong>{management.state === "available" ? management.models.length : "Unknown"}</strong></div>
          <div className="operations-overview-stat"><span>Retained LLM comparisons</span><strong>{sources[2].count ?? "Unknown"}</strong></div>
          <div className="operations-overview-stat"><span>Matching ticker research records</span><strong>{sources[3].count ?? "Not checked"}</strong></div>
          <div className="operations-overview-stat"><span>Market transport</span><strong>{sources[0].status}</strong></div>
        </div>
        {management.partialErrors.map((error) => <p className="metric-detail" role="status" key={error}>{error}</p>)}
        <p className="section-copy">A healthy transport does not prove that models ran successfully. A completed research job does not establish forecast accuracy, PIT qualification, Final Test approval, or trading permission. The backend has no verified general-purpose Experiment Memory HTTP publication contract, so its private contents are not inferred here.</p>
        <p className="section-copy"><Link href="/ai-research-models">Inspect model management and contract-matched runs</Link> · <Link href="/research-path">Follow the market evidence path</Link> · <Link href="/diagnostics">Inspect operational diagnostics</Link></p>
      </section>
    </>
  );
}
