import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { ResearchModelEvidenceComparison } from "@/components/stocks/ResearchModelEvidenceComparison";
import {
  loadResearchComparison,
  parseResearchComparisonFilters,
  RESEARCH_COMPARISON_MAX_RECORDS,
} from "@/data/ResearchComparisonDataSource";

export const dynamic = "force-dynamic";

export default async function ResearchHistoryComparisonPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ticker } = await params;
  const query = await searchParams;
  const fromDate = typeof query.fromDate === "string" && query.fromDate ? query.fromDate : undefined;
  const toDate = typeof query.toDate === "string" && query.toDate ? query.toDate : undefined;
  const filters = parseResearchComparisonFilters(fromDate, toDate);
  const outcome = filters
    ? await loadResearchComparison(ticker, filters)
    : { state: "invalid" as const, records: [], totalRecords: null, examined: 0, pagesFetched: 0, message: "Invalid calendar date or date range." };
  const canDisplay = outcome.state === "complete" || outcome.state === "limited";

  return (
    <>
      <Link href={"/stocks/" + encodeURIComponent(ticker) + "#daily-research"} className="back-link">← Back to stock research</Link>
      <PageHeader
        eyebrow="Daily research evidence"
        title="Historical model comparison"
        badge={outcome.state === "complete" ? "Complete published range" : outcome.state === "limited" ? "Partial published range" : "Unavailable"}
        description={"Compare explicitly published research jobs for " + ticker + " across consecutive API pages. No model training, inferred price performance or synthetic fallback is performed."}
      />
      <section className="panel single-panel" aria-label="Research comparison date filters">
        <div className="panel-heading"><h2>Research date window</h2><span className="panel-count">Read-only</span></div>
        <form action={"/stocks/" + encodeURIComponent(ticker) + "/research-comparison"} method="get" className="stock-analysis-stats">
          <div><label htmlFor="comparison-from">From</label><input id="comparison-from" name="fromDate" type="date" defaultValue={fromDate ?? ""}/></div>
          <div><label htmlFor="comparison-to">To</label><input id="comparison-to" name="toDate" type="date" defaultValue={toDate ?? ""}/></div>
          <div><button type="submit">Compare published research</button></div>
        </form>
        <p className="section-copy">The backend date range is inclusive. At most five requests of 200 records each are made. This is a comparison of published job activity, not research quality, price direction accuracy or investment returns.</p>
      </section>
      <section className="panel single-panel" aria-label="Historical comparison coverage">
        <div className="panel-heading"><h2>Publication coverage</h2><span className="panel-count">{outcome.state}</span></div>
        <p role="status" className="section-copy">{outcome.message}</p>
        <div className="operations-overview-grid">
          <div className="operations-overview-stat"><span>Retrieved records</span><strong>{outcome.examined}</strong></div>
          <div className="operations-overview-stat"><span>Matching published total</span><strong>{outcome.totalRecords ?? "Unavailable"}</strong></div>
          <div className="operations-overview-stat"><span>Validated pages</span><strong>{outcome.pagesFetched}</strong></div>
          <div className="operations-overview-stat"><span>Maximum retrieval</span><strong>{RESEARCH_COMPARISON_MAX_RECORDS}</strong></div>
        </div>
        <p className="metric-detail">If page totals, ordering or job identities change while fetching, the comparison is withheld. Counts are shown as complete only when every matching record was retrieved. A limited range is explicitly partial.</p>
      </section>
      {canDisplay ? <ResearchModelEvidenceComparison
        records={outcome.records}
        totalRecords={outcome.totalRecords ?? outcome.records.length}
        scope={outcome.state === "complete" ? "complete" : "limited"}
      /> : null}
    </>
  );
}
