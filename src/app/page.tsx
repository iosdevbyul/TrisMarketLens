import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { WakMetricCard } from "@/components/design-system/WakMetricCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
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
          <WakSectionHeader eyebrow="Evidence" title="Research readiness" trailing={<span className="panel-count">{status.evidence.length} checks</span>} />
          <StatusList items={status.evidence} />
        </WakPanel>

        <WakPanel>
          <WakSectionHeader eyebrow="Baseline" title="Historical run" />
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
