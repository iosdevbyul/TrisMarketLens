import Link from "next/link";

import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { getDataSource } from "@/data/getDataSource";

function formatMetric(value: number) {
  return value.toFixed(6);
}

function roleLabel(role: "baseline_executable" | "research_only") {
  return role === "baseline_executable" ? "Baseline executable" : "Research only";
}

export default async function ModelsPage() {
  const dataSource = getDataSource();
  const models = await dataSource.getModelSummaries();

  return (
    <>
      <PageHeader
        badge="Qualified research models"
        description="Validation and frozen out-of-sample classification metrics are shown here. Backtest performance is intentionally excluded."
        eyebrow="Research"
        title="Models"
      />

      <section className="model-grid">
        {models.map((model) => (
          <Link className="panel model-card model-link" href={"/models/" + model.id} key={model.id}>
            <div className="model-card-header">
              <div>
                <p className="eyebrow">{model.direction} direction</p>
                <h2>{model.modelName}</h2>
              </div>
              <WakStatusBadge state={model.role === "baseline_executable" ? "verified" : "not_started"} label={roleLabel(model.role)} />
            </div>

            <dl className="metric-list">
              <div>
                <dt>Validation AP</dt>
                <dd>{formatMetric(model.validationAveragePrecision)}</dd>
              </div>
              <div>
                <dt>OOS AP</dt>
                <dd>{formatMetric(model.oosAveragePrecision)}</dd>
              </div>
            </dl>

            <p className="section-copy">{model.note}</p>
            <span className="model-link-action">View model details →</span>
          </Link>
        ))}
      </section>
    </>
  );
}
