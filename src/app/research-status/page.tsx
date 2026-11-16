import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { checkBackendHealth } from "@/data/backendHealth";
import { getAIManagementSnapshot } from "@/data/AIModelManagementDataSource";
import { getDailyResearch } from "@/data/DailyResearchDataSource";
import { researchSourceRows } from "@/domain/researchSourceStatus";

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
  const requiringAttention = sources.filter((item) => item.status === "unavailable" || item.status === "disconnected");
  return (
    <>
      <PageHeader
        eyebrow="Research infrastructure"
        title="Integrated AI research status"
        badge={requiringAttention.length ? "Partial or disconnected" : "Source observations"}
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
