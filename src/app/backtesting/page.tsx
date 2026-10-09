import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { mockDataSource } from "@/data/MockDataSource";

export default async function BacktestingPage() {
  const status = await mockDataSource.getProjectStatus();

  return (
    <>
      <PageHeader
        badge="No performance data yet"
        description="The baseline strategy is locked, but the historical run will not execute until the input evidence is frozen."
        eyebrow="Backtesting"
        title="Baseline"
      />

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Readiness</p>
            <h2>Run gate</h2>
          </div>
        </div>
        <StatusList items={status.baseline} />
        <div className="run-lock">
          <p>No fabricated performance metrics.</p>
          <span>
            Return, CAGR, drawdown, Sharpe, win rate, trades, and the equity curve
            will stay absent until the locked historical baseline is actually run.
          </span>
        </div>
      </section>
    </>
  );
}
