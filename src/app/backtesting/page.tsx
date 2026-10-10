import { getTranslator } from "@/i18n/server";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { WakStatusBadge } from "@/components/design-system/WakStatusBadge";
import { getDataSource } from "@/data/getDataSource";

export default async function BacktestingPage() {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const baseline = await dataSource.getBaselineBacktest();

  return (
    <>
      <PageHeader
        badge={t("Run not executed")}
        description={t("The locked baseline contract is visible now, while performance remains intentionally unavailable until the evidence blockers, runner tail integration, and run-input freeze are complete.")}
        eyebrow={t("Backtesting")}
        title={t("Historical research")}
      />

      <section className="backtest-overview-grid">
        <Link className="panel backtest-card" href="/backtesting/baseline">
          <div className="backtest-card-header">
            <div>
              <p className="eyebrow">{t("Locked policy")}</p>
              <h2>{t(baseline.title)}</h2>
            </div>
            <WakStatusBadge state="blocked" />
          </div>
          <p className="section-copy">{t(baseline.summary)}</p>
          <span className="backtest-card-action">{t("View baseline contract →")}</span>
        </Link>

        <WakPanel>
          <WakSectionHeader eyebrow={t("Readiness")} title={t("Run gate")} trailing={<span className="panel-count">{baseline.readiness.length} checks</span>} />
          <StatusList items={baseline.readiness} />
        </WakPanel>
      </section>

      <WakPanel as="section" className="single-panel">
        <p className="eyebrow">{t("Performance")}</p>
        <h2>{t("No historical results yet")}</h2>
        <div className="run-lock">
          <p>{t("No fabricated performance metrics.")}</p>
          <span>
            {t("Return, CAGR, drawdown, Sharpe, win rate, trade history, monthly returns,\n            and the equity curve stay absent until the locked run actually executes.")}
          </span>
        </div>
      </WakPanel>
    </>
  );
}
