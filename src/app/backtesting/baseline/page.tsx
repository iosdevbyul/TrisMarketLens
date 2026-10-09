import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { RuleGroup } from "@/components/backtesting/RuleGroup";
import { getDataSource } from "@/data/getDataSource";

export default async function BaselineBacktestPage() {
  const dataSource = getDataSource();
  const baseline = await dataSource.getBaselineBacktest();

  return (
    <>
      <Link className="back-link" href="/backtesting">
        ← Back to backtesting
      </Link>

      <PageHeader
        badge="Blocked before execution"
        description={baseline.summary}
        eyebrow="Historical baseline"
        title="Baseline contract"
      />

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Run readiness</p>
            <h2>Pre-execution gates</h2>
          </div>
          <span className="status-pill" data-state="blocked">
            Not ready
          </span>
        </div>
        <StatusList items={baseline.readiness} />
      </section>

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Chronology</p>
            <h2>Anchor and execution tails</h2>
          </div>
          <span className="panel-count">No signal generation in tail</span>
        </div>

        <div className="backtest-timeline">
          {baseline.timeline.map((item, index) => (
            <article className="timeline-item" key={item.label}>
              <span className="timeline-index">{index + 1}</span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="backtest-rule-grid">
        {baseline.policyGroups.map((group) => (
          <RuleGroup group={group} key={group.title} />
        ))}
      </section>

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Immutable references</p>
            <h2>Policy and evidence identities</h2>
          </div>
        </div>

        <div className="fingerprint-list">
          {baseline.fingerprints.map((fingerprint) => (
            <div key={fingerprint.label}>
              <span>{fingerprint.label}</span>
              <code>{fingerprint.value}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">Performance surface</p>
        <h2>Waiting for the locked run</h2>
        <div className="performance-placeholder">
          <div>
            <span>Total return</span>
            <strong>—</strong>
          </div>
          <div>
            <span>CAGR</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Max drawdown</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Sharpe</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Trades</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Win rate</span>
            <strong>—</strong>
          </div>
        </div>
        <p className="section-copy">
          These fields are structural placeholders only. They will receive values
          from the immutable historical-run artifact after the baseline input freeze.
        </p>
      </section>
    </>
  );
}
