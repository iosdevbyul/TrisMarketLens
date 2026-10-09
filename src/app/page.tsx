import { StatusList } from "@/components/dashboard/StatusList";
import { mockDataSource } from "@/data/MockDataSource";

const navigation = [
  "Overview",
  "Stocks",
  "Models",
  "Evidence",
  "Backtesting",
];

export default async function Home() {
  const status = await mockDataSource.getProjectStatus();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <p className="brand-name">Tris</p>
            <p className="brand-subtitle">Market Lens</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navigation.map((item, index) => (
            <button
              className="nav-item"
              data-active={index === 0}
              key={item}
              type="button"
            >
              <span>{item}</span>
              {index > 0 ? <small>Soon</small> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="live-dot" />
          Research environment
        </div>
      </aside>

      <section className="content">
        <header className="hero">
          <div>
            <p className="eyebrow">Research dashboard</p>
            <h1>{status.productName}</h1>
            <p className="hero-copy">
              A research-first view of market data, model qualification,
              evidence readiness, and backtesting.
            </p>
          </div>
          <span className="mock-badge">{status.sourceLabel}</span>
        </header>

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
                Performance metrics will appear only after the run-input freeze is
                complete.
              </span>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
