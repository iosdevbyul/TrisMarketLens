import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { mockDataSource } from "@/data/MockDataSource";

export default async function Home() {
  const status = await mockDataSource.getProjectStatus();

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
          <article className="metric-card" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2>Research readiness</h2>
            </div>
            <span className="panel-count">{status.evidence.length} checks</span>
          </div>
          <StatusList items={status.evidence} />
        </article>

        <article className="panel">
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
        </article>
      </section>
    </>
  );
}
