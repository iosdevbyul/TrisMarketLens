import { Localize } from "@/i18n/Localize";
import {
  EVALUATION_METRICS,
  metricDistribution,
  summarizeStudyEvidence,
  type EvaluationMetricKey,
} from "@/domain/autonomousResearchInsights";
import type { ResearchStudyView } from "@/domain/autonomousResearchPublication";

function value(score: number | null): string {
  return score === null ? "Not reported" : score.toFixed(4);
}
export function AutonomousStudyInsights({
  study, selectedMetric,
}: {
  study: ResearchStudyView;
  selectedMetric: EvaluationMetricKey;
}) {
  const distribution = metricDistribution(study.results, selectedMetric);
  const summary = summarizeStudyEvidence(study);
  const maxBucket = Math.max(...distribution.buckets.map(bucket=>bucket.count),1);
  const label = EVALUATION_METRICS.find(item=>item.key===selectedMetric)?.label ?? "Mean average precision";
  const count = study.results.length;
  return (
    <section aria-label="Autonomous research evaluation insights">
      <h3><Localize text="Within-study evaluation distribution" /></h3>
      <p className="section-copy"><Localize text="Summaries below describe retained result observations in this one research database. Their storage order is not a chronological evaluation series, and they cannot establish improvement across distinct datasets, research periods or holdout conditions." /></p>
      <form action="/autonomous-research" method="get" className="stock-explorer">
        <input type="hidden" name="study" value={study.study}/>
        <label htmlFor="evaluation-metric"><Localize text="Evaluation metric" /></label>
        <select id="evaluation-metric" name="metric" defaultValue={selectedMetric}>
          {EVALUATION_METRICS.map(item=>
            <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <button type="submit"><Localize text="Inspect distribution" /></button>
      </form>
      <p className="metric-detail">Selected metric: {label}. Scored observations: {distribution.observed} of {count}; missing: {distribution.missing}.</p>
      <div className="operations-overview-grid">
        {([
          ["Minimum",distribution.minimum],["First quartile",distribution.q1],
          ["Median",distribution.median],["Third quartile",distribution.q3],
          ["Maximum",distribution.maximum],
        ] as const).map(([title,number])=>
          <div key={title} className="operations-overview-stat">
            <span>{title}</span><strong>{value(number)}</strong>
          </div>)}
      </div>
      <div aria-label={label + " histogram"} role="group" style={{display:"grid",gap:"12px",marginTop:"20px"}}>
        {distribution.buckets.map(bucket=><div key={bucket.range}
          style={{display:"grid",gridTemplateColumns:"92px minmax(0,1fr) 44px",alignItems:"center",gap:"12px"}}>
          <span className="metric-detail">{bucket.range}</span>
          <div style={{height:"14px",borderRadius:"5px",background:"var(--surface-strong)",overflow:"hidden"}}>
            <div style={{height:"100%",width:(bucket.count/maxBucket*100)+"%",background:"var(--accent)"}}/>
          </div>
          <strong style={{fontSize:"12px",fontVariantNumeric:"tabular-nums"}}>{bucket.count}</strong>
        </div>)}
      </div>
      {distribution.observed===0 ? <p role="status" className="section-copy">No valid reported measurements for the selected metric; no inferred score is shown.</p> : null}
      <h3><Localize text="Research evidence and review boundaries" /></h3>
      <div className="operations-overview-grid">
        {([
          ["Performance approved (explicit true)",summary.approved],
          ["PIT qualified (explicit true)",summary.pitQualified],
          ["Execution authorized (explicit true)",summary.executionAuthorized],
          ["Performance approval unreported",summary.approvalUnknown],
          ["PIT qualification unreported",summary.pitUnknown],
          ["Deferred diagnostics recorded",summary.diagnosticPresence.deferred],
          ["Robustness summaries recorded",summary.diagnosticPresence.robustness],
          ["Generalization training recorded",summary.diagnosticPresence.generalization],
        ] as const).map(([name,value])=>
          <div key={name} className="operations-overview-stat"><span>{name}</span><strong>{value} / {count} results</strong></div>)}
      </div>
      <p className="metric-detail" role="status">
        {summary.complete
          ? "All declared records for this included study are present in the local publication."
          : "This study has incomplete or capped publication records. The counts below refer only to included observations."}
        {" "}Diagnostic presence alone does not establish passing a holdout or independent future performance.
        Approval flags are observations in retained research artifacts, never permission to trade through this web app.
      </p>
      <div className="panel-grid">
        <section aria-label="Run state counts">
          <h3><Localize text="Run states" /></h3>
          {summary.runStates.length ? <div className="status-list">{summary.runStates.map(item=>
            <div key={item.state} className="status-row"><span>{item.state}</span><strong>{item.count}</strong></div>)}</div>
            : <p className="metric-detail"><Localize text="No run states published." /></p>}
        </section>
        <section aria-label="Terminal state counts">
          <h3><Localize text="Terminal states" /></h3>
          {summary.terminalStates.length ? <div className="status-list">{summary.terminalStates.map(item=>
            <div key={item.state} className="status-row"><span>{item.state}</span><strong>{item.count}</strong></div>)}</div>
            : <p className="metric-detail"><Localize text="No terminal states published." /></p>}
        </section>
      </div>
      <p className="metric-detail"><Localize text="The state counts are independent retained artifacts, not a joined run-to-experiment lifecycle. Original experiment IDs and cross-record join keys remain private in this publication." /></p>
    </section>
  );
}
