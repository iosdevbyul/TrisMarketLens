import { PageHeader } from "@/components/common/PageHeader";
import { mockDataSource } from "@/data/MockDataSource";

function formatMetric(value: number) {
  return value.toFixed(6);
}

export default async function ModelsPage() {
  const models = await mockDataSource.getModelSummaries();

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
          <article className="panel model-card" key={model.direction}>
            <div className="model-card-header">
              <div>
                <p className="eyebrow">{model.direction} direction</p>
                <h2>{model.modelName}</h2>
              </div>
              <span className="status-pill" data-state="verified">
                Qualified
              </span>
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
          </article>
        ))}
      </section>
    </>
  );
}
