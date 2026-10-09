import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { getDataSource } from "@/data/getDataSource";

export default async function BacktestingPage() {
  const dataSource = getDataSource();
  const baseline = await dataSource.getBaselineBacktest();

  return (
    <>
      <PageHeader
        badge="Run not executed"
        description="The locked baseline contract is visible now, while performance remains intentionally unavailable until the evidence blockers, runner tail integration, and run-input freeze are complete."
        eyebrow="Backtesting"
        title="Historical research"
      />

      <section className="backtest-overview-grid">
        <Link className="panel backtest-card" href="/backtesting/baseline">
          <div className="backtest-card-header">
            <div>
              <p className="eyebrow">Locked policy</p>
              <h2>{baseline.title}</h2>
            </div>
            <span className="status-pill" data-state="blocked">
              Blocked
            </span>
          </div>
          <p className="section-copy">{baseline.summary}</p>
          <span className="backtest-card-action">View baseline contract →</span>
        </Link>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Readiness</p>
              <h2>Run gate</h2>
            </div>
            <span className="panel-count">{baseline.readiness.length} checks</span>
          </div>
          <StatusList items={baseline.readiness} />
        </article>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">Performance</p>
        <h2>No historical results yet</h2>
        <div className="run-lock">
          <p>No fabricated performance metrics.</p>
          <span>
            Return, CAGR, drawdown, Sharpe, win rate, trade history, monthly returns,
            and the equity curve stay absent until the locked run actually executes.
          </span>
        </div>
      </section>
    </>
  );
}
