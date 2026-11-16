import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getAutonomousResearchPublication } from "@/data/AutonomousResearchDataSource";
import {
  researchStudySummary,
  type ResearchStudyView,
} from "@/domain/autonomousResearchPublication";

export const dynamic = "force-dynamic";

function number(value: number | null): string {
  return value === null ? "Unreported" : String(value);
}
function score(value: number | null): string {
  return value === null ? "Unreported" : value.toFixed(4);
}
function yesNo(value: boolean | null): string {
  return value === null ? "Not reported" : value ? "Yes" : "No";
}
function studyMetrics(study: ResearchStudyView) {
  const metrics = researchStudySummary(study);
  return [
    ["Research runs", study.kinds.autonomous_run],
    ["Recorded experiment results", study.kinds.autonomous_result],
    ["Candidate selections", study.kinds.autonomous_selection],
    ["Terminal events", study.kinds.autonomous_terminal],
    ["Mean AP observations", metrics.meanApObserved],
    ["Mean AP min / max (within this study)", metrics.meanApMin === null ? "Unreported" : score(metrics.meanApMin) + " / " + score(metrics.meanApMax)],
  ] as const;
}

export default async function AutonomousResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string }>;
}) {
  const query = await searchParams;
  const snapshot = await getAutonomousResearchPublication();
  const studies = snapshot.publication?.studies ?? [];
  const selected = typeof query.study === "string"
    ? studies.find(study => study.study === query.study) : undefined;
  const current = selected ?? studies[0];
  const invalidSelection = !!query.study && !selected;
  return (
    <>
      <Link className="back-link" href="/research-status">← Back to research status</Link>
      <PageHeader
        eyebrow="Autonomous research"
        title="Retained experiment evidence"
        badge={snapshot.state === "available" ? "Operator local snapshot" : "Not published"}
        description="Inspect completed research records and evaluation observations from the existing local autonomous engine. This is not a live trading system, historical PIT certificate, or forecast leaderboard."
      />
      <section className="panel single-panel" aria-label="Autonomous research publication source">
        <div className="panel-heading"><h2>Independent research publication</h2><span className="panel-count">{snapshot.state}</span></div>
        <p className="section-copy" role="status">{snapshot.message}</p>
        <p className="metric-detail">
          This view uses a separate, opt-in server-side snapshot containing only approved summary fields.
          Research databases and private checkpoint/source identities are never sent to the browser.
          This is separate from Daily Research, which currently requires its own backend snapshot.
        </p>
        {snapshot.state !== "available" ? <>
          <p className="section-copy">
            Run <code>python3 scripts/export-autonomous-research.py</code> from TrisMarketLens
            on the operator Mac. Then set <code>MARKET_LENS_AUTONOMOUS_RESEARCH_SOURCE=local_snapshot</code>
            in <code>.env.local</code> and restart the web process.
          </p>
          <p><Link href="/ai-research-models">Inspect existing authenticated LLM management</Link></p>
        </> : null}
      </section>
      {snapshot.publication ? <>
        <section className="panel single-panel" aria-label="Autonomous research coverage">
          <div className="panel-heading"><h2>Retained research coverage</h2>
            <span className="panel-count">{snapshot.publication.studyCount} study databases</span></div>
          <div className="operations-overview-grid">
            {([
              ["Research run records", snapshot.publication.aggregateCounts.autonomous_run],
              ["Experiment result records", snapshot.publication.aggregateCounts.autonomous_result],
              ["Selection records", snapshot.publication.aggregateCounts.autonomous_selection],
              ["Terminal records", snapshot.publication.aggregateCounts.autonomous_terminal],
            ] as const).map(([name,value]) =>
              <div className="operations-overview-stat" key={name}><span>{name}</span><strong>{value}</strong></div>)}
          </div>
          <p className="section-copy">
            Generated: {snapshot.publication.generatedAt}. These are raw retained counts across databases,
            NOT deduplicated independent studies or successful experiments.
            {snapshot.publication.containsPartialStudies
              ? " Some databases or records were skipped or capped; counts and visible details are incomplete."
              : " Each eligible database was projected within the configured cap."}
          </p>
        </section>
        <section className="panel single-panel" aria-label="Autonomous research study selection">
          <div className="panel-heading"><h2>Study evidence</h2><span className="panel-count">Compare only within a study</span></div>
          <form action="/autonomous-research" method="get" className="stock-explorer">
            <label htmlFor="autonomous-study">Research database</label>
            <select name="study" id="autonomous-study" defaultValue={current?.study ?? ""}>
              {studies.map(study=><option value={study.study} key={study.study}>{study.study}</option>)}
            </select>
            <button type="submit">Inspect study</button>
          </form>
          {invalidSelection ? <p role="status" className="metric-detail">Unknown study; showing the first published study instead.</p> : null}
          {current ? <>
            <h3>{current.study}</h3>
            <div className="operations-overview-grid">
              {studyMetrics(current).map(([name,value]) =>
                <div className="operations-overview-stat" key={name}><span>{name}</span><strong>{value}</strong></div>)}
            </div>
            {current.truncated ? <p role="status" className="metric-detail">This study is only partially included in the published projection.</p> : null}
            <h3>Research execution history</h3>
            {current.runs.length ? <div className="stock-table" style={{overflowX:"auto"}}>
              <table style={{width:"100%",minWidth:"760px",textAlign:"left"}}>
                <thead><tr>{["Recorded at","Agent","State","Attempts","Completed","Failed","Trained","PIT","Approved"].map(label=>
                  <th key={label} scope="col" style={{padding:"10px"}}>{label}</th>)}</tr></thead>
                <tbody>{current.runs.map((run,index)=><tr key={index}>
                  <td style={{padding:"10px"}}>{run.recordedAt ?? "Unreported"}</td>
                  <td style={{padding:"10px"}}>{run.agent ?? "Unreported"}</td>
                  <td style={{padding:"10px"}}>{run.state ?? "Unreported"}</td>
                  <td style={{padding:"10px"}}>{number(run.attempts)}</td>
                  <td style={{padding:"10px"}}>{number(run.completed)}</td>
                  <td style={{padding:"10px"}}>{number(run.failed)}</td>
                  <td style={{padding:"10px"}}>{number(run.trainedThisRun)}</td>
                  <td style={{padding:"10px"}}>{yesNo(run.pitQualified)}</td>
                  <td style={{padding:"10px"}}>{yesNo(run.performanceApproved)}</td>
                </tr>)}</tbody>
              </table></div> : <p className="section-copy">No run records published for this study.</p>}
            <h3>Experiment evaluation observations</h3>
            {current.results.length ? <div className="stock-table" style={{overflowX:"auto"}}>
              <table style={{width:"100%",minWidth:"680px",textAlign:"left"}}>
                <thead><tr>{["Result #","Mean AP","Stability AP","Worst balanced accuracy","Train gap","Deferred diagnostic","Robustness","Approval"].map(label=>
                  <th key={label} scope="col" style={{padding:"10px"}}>{label}</th>)}</tr></thead>
                <tbody>{current.results.map((item,index)=><tr key={index}>
                  <td style={{padding:"10px"}}>{index+1}</td>
                  <td style={{padding:"10px"}}>{score(item.meanAp)}</td>
                  <td style={{padding:"10px"}}>{score(item.stabilityAp)}</td>
                  <td style={{padding:"10px"}}>{score(item.worstBalancedAccuracy)}</td>
                  <td style={{padding:"10px"}}>{number(item.largestTrainGap)}</td>
                  <td style={{padding:"10px"}}>{item.hasDeferredDiagnostic ? "Recorded" : "Not present"}</td>
                  <td style={{padding:"10px"}}>{item.hasRobustSummary ? "Recorded" : "Not present"}</td>
                  <td style={{padding:"10px"}}>{yesNo(item.performanceApproved)}</td>
                </tr>)}</tbody>
              </table></div> : <p className="section-copy">No experiment result records published for this study.</p>}
            <h3>Selection and terminal states</h3>
            <div className="operations-overview-grid">
              <div className="operations-overview-stat"><span>Selection rows included</span><strong>{current.selections.length}</strong></div>
              <div className="operations-overview-stat"><span>Terminal rows included</span><strong>{current.terminals.length}</strong></div>
              <div className="operations-overview-stat"><span>Generalization-training summaries present</span>
                <strong>{current.results.filter(item=>item.hasGeneralizationTraining).length}</strong></div>
              <div className="operations-overview-stat"><span>Deferred diagnostics present</span>
                <strong>{current.results.filter(item=>item.hasDeferredDiagnostic).length}</strong></div>
            </div>
            <p className="metric-detail">
              Evaluation metrics are retrospective research observations.
              No cross-dataset ranking, statistical improvement or forward performance is inferred.
              Presence of a diagnostic object is not evidence it passed.
              Run/selection/result row positions have no verified shared identifier in this redacted view.
            </p>
          </> : <p>No eligible studies in publication.</p>}
        </section>
      </> : null}
    </>
  );
}
