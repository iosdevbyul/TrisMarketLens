import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { WakMetricCard } from "@/components/design-system/WakMetricCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { getDataSource } from "@/data/getDataSource";

export default async function Home() {
  const dataSource = getDataSource();
  const status = await dataSource.getProjectStatus();

  return (
    <>
      <PageHeader
        badge={status.sourceLabel}
        description="A research-first view of market data, model qualification, evidence readiness, and backtesting."
        eyebrow="Research dashboard"
        title={status.productName}
      />

      <section className="metric-grid" aria-label="Research summary">
        {status.metrics.map((metric) => (
          <WakMetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="panel-grid">
        <WakPanel>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2>Research readiness</h2>
            </div>
            <span className="panel-count">{status.evidence.length} checks</span>
          </div>
          <StatusList items={status.evidence} />
        </WakPanel>

        <WakPanel>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Baseline</p>
              <h2>Historical run</h2>
            </div>
          </div>
          <StatusList items={status.baseline} />
          <div className="run-lock">
            <p>Historical baseline is intentionally locked.</p>
            <span>
              Performance metrics will appear only after the run-input freeze is complete.
            </span>
          </div>
        </WakPanel>
      </section>
    </>
  );
}
