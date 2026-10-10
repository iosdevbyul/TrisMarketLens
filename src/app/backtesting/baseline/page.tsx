import { getTranslator } from "@/i18n/server";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { RuleGroup } from "@/components/backtesting/RuleGroup";
import { getDataSource } from "@/data/getDataSource";

export default async function BaselineBacktestPage() {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const baseline = await dataSource.getBaselineBacktest();

  return (
    <>
      <Link className="back-link" href="/backtesting">
        {t("← Back to backtesting")}
      </Link>

      <PageHeader
        badge={t("Blocked before execution")}
        description={t(baseline.summary)}
        eyebrow={t("Historical baseline")}
        title={t("Baseline contract")}
      />

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("Run readiness")}</p>
            <h2>{t("Pre-execution gates")}</h2>
          </div>
          <span className="status-pill" data-state="blocked">
            {t("Not ready")}
          </span>
        </div>
        <StatusList items={baseline.readiness} />
      </section>

      <section className="panel single-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("Chronology")}</p>
            <h2>{t("Anchor and execution tails")}</h2>
          </div>
          <span className="panel-count">{t("No signal generation in tail")}</span>
        </div>

        <div className="backtest-timeline">
          {baseline.timeline.map((item, index) => (
            <article className="timeline-item" key={t(item.label)}>
              <span className="timeline-index">{index + 1}</span>
              <div>
                <p>{t(item.label)}</p>
                <strong>{item.value}</strong>
                <span>{t(item.detail)}</span>
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
            <p className="eyebrow">{t("Immutable references")}</p>
            <h2>{t("Policy and evidence identities")}</h2>
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
        <p className="eyebrow">{t("Performance surface")}</p>
        <h2>{t("Waiting for the locked run")}</h2>
        <div className="performance-placeholder">
          <div>
            <span>{t("Total return")}</span>
            <strong>—</strong>
          </div>
          <div>
            <span>{t("CAGR")}</span>
            <strong>—</strong>
          </div>
          <div>
            <span>{t("Max drawdown")}</span>
            <strong>—</strong>
          </div>
          <div>
            <span>{t("Sharpe")}</span>
            <strong>—</strong>
          </div>
          <div>
            <span>{t("Trades")}</span>
            <strong>—</strong>
          </div>
          <div>
            <span>{t("Win rate")}</span>
            <strong>—</strong>
          </div>
        </div>
        <p className="section-copy">
          {t("These fields are structural placeholders only. They will receive values\n          from the immutable historical-run artifact after the baseline input freeze.")}
        </p>
      </section>
    </>
  );
}
