import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { MetricComparison } from "@/components/models/MetricComparison";
import { mockDataSource } from "@/data/MockDataSource";
import type { ModelDirection } from "@/domain/research";

interface ModelDetailPageProps {
  params: Promise<{ direction: string }>;
}

function isModelDirection(value: string): value is ModelDirection {
  return value === "up" || value === "down";
}

function formatMetric(value: number) {
  return value.toFixed(6);
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { direction } = await params;

  if (!isModelDirection(direction)) {
    notFound();
  }

  const model = await mockDataSource.getModel(direction);

  if (!model) {
    notFound();
  }

  const roleLabel =
    model.role === "baseline_executable" ? "Baseline executable" : "Research only";

  return (
    <>
      <Link className="back-link" href="/models">
        ← Back to models
      </Link>

      <PageHeader
        badge={roleLabel}
        description={model.note}
        eyebrow={model.direction + " direction"}
        title={model.modelName}
      />

      <section className="model-detail-grid">
        <article className="panel">
          <p className="eyebrow">Selection</p>
          <h2>Research qualification</h2>
          <dl className="metric-list">
            <div>
              <dt>CV mean AP</dt>
              <dd>{formatMetric(model.selectionMeanAveragePrecision)}</dd>
            </div>
            <div>
              <dt>CV AP std</dt>
              <dd>{formatMetric(model.selectionStdAveragePrecision)}</dd>
            </div>
            <div>
              <dt>Decision threshold</dt>
              <dd>{model.provenance.threshold.toFixed(1)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Contract</p>
          <h2>Model role</h2>
          <div className="model-role-block">
            <span
              className="status-pill"
              data-state={model.role === "baseline_executable" ? "verified" : "not_started"}
            >
              {roleLabel}
            </span>
            <p>
              {model.role === "baseline_executable"
                ? "This direction is permitted by the locked long-only baseline policy."
                : "This model remains qualified research evidence but is not executed by the locked baseline policy."}
            </p>
          </div>
        </article>
      </section>

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Classification metrics</p>
            <h2>Validation vs frozen OOS</h2>
          </div>
          <span className="panel-count">No backtest metrics</span>
        </div>

        <div className="comparison-grid">
          <MetricComparison
            label="Average precision"
            oos={model.oos.averagePrecision}
            validation={model.validation.averagePrecision}
          />
          <MetricComparison
            label="Precision"
            oos={model.oos.precision}
            validation={model.validation.precision}
          />
          <MetricComparison
            label="Recall"
            oos={model.oos.recall}
            validation={model.validation.recall}
          />
          <MetricComparison
            label="F1"
            oos={model.oos.f1}
            validation={model.validation.f1}
          />
        </div>

        <div className="model-metric-table">
          <div className="model-metric-row model-metric-header">
            <span>Dataset</span>
            <span>Samples</span>
            <span>AP</span>
            <span>Brier</span>
          </div>
          <div className="model-metric-row">
            <span>Validation</span>
            <span>{model.validation.sampleCount.toLocaleString()}</span>
            <span>{formatMetric(model.validation.averagePrecision)}</span>
            <span>{formatMetric(model.validation.brier)}</span>
          </div>
          <div className="model-metric-row">
            <span>Frozen OOS</span>
            <span>{model.oos.sampleCount.toLocaleString()}</span>
            <span>{formatMetric(model.oos.averagePrecision)}</span>
            <span>{formatMetric(model.oos.brier)}</span>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <p className="eyebrow">Feature and label contract</p>
          <h2>Research inputs</h2>
          <dl className="metric-list">
            <div>
              <dt>Feature set</dt>
              <dd>{model.provenance.featureSet}</dd>
            </div>
            <div>
              <dt>Label</dt>
              <dd>{model.provenance.label}</dd>
            </div>
            <div>
              <dt>Horizon</dt>
              <dd>{model.provenance.horizonSessions} sessions</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Estimator</p>
          <h2>Locked configuration</h2>
          <dl className="metric-list compact-metric-list">
            <div>
              <dt>Max leaf nodes</dt>
              <dd>{model.provenance.maxLeafNodes}</dd>
            </div>
            <div>
              <dt>Learning rate</dt>
              <dd>{model.provenance.learningRate}</dd>
            </div>
            <div>
              <dt>Max iterations</dt>
              <dd>{model.provenance.maxIterations}</dd>
            </div>
            <div>
              <dt>Min samples leaf</dt>
              <dd>{model.provenance.minSamplesLeaf}</dd>
            </div>
            <div>
              <dt>L2 regularization</dt>
              <dd>{model.provenance.l2Regularization}</dd>
            </div>
            <div>
              <dt>Max bins</dt>
              <dd>{model.provenance.maxBins}</dd>
            </div>
            <div>
              <dt>Class weight</dt>
              <dd>{model.provenance.classWeight}</dd>
            </div>
            <div>
              <dt>Early stopping</dt>
              <dd>{model.provenance.earlyStopping ? "On" : "Off"}</dd>
            </div>
            <div>
              <dt>Random seed</dt>
              <dd>{model.provenance.randomSeed}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="panel single-panel">
        <p className="eyebrow">Artifact provenance</p>
        <h2>Locked model identity</h2>
        <code className="artifact-sha">{model.provenance.artifactSha256}</code>
        <p className="section-copy">
          This page presents the frozen research artifact identity only. It does not
          invoke model loading, inference, signal generation, or backtesting.
        </p>
      </section>
    </>
  );
}
