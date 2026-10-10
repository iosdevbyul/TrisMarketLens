import { getTranslator } from "@/i18n/server";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusList } from "@/components/dashboard/StatusList";
import { WakMetricCard } from "@/components/design-system/WakMetricCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { getDataSource } from "@/data/getDataSource";
import { getScreener } from "@/data/ScreenerDataSource";
import { getLocale } from "@/i18n/server";
import { AnalysisOverviewPanel } from "@/components/dashboard/AnalysisOverviewPanel";

export default async function Home() {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const [status, screener, locale] = await Promise.all([dataSource.getProjectStatus(), getScreener(), getLocale()]);

  return (
    <>
      <PageHeader
        badge={t(status.sourceLabel)}
        description={t("A research-first view of market data, model qualification, evidence readiness, and backtesting.")}
        eyebrow={t("Research dashboard")}
        title={status.productName}
      />

      <section className="metric-grid" aria-label={t("Research summary")}>
        {status.metrics.map((metric) => (
          <WakMetricCard key={t(metric.label)} label={t(metric.label)} value={metric.value} detail={t(metric.detail)} />
        ))}
      </section>

      <AnalysisOverviewPanel result={screener} locale={locale} />

      <section className="panel-grid">
        <WakPanel>
          <WakSectionHeader eyebrow={t("Evidence")} title={t("Research readiness")} trailing={<span className="panel-count">{status.evidence.length} {t("checks")}</span>} />
          <StatusList items={status.evidence} />
        </WakPanel>

        <WakPanel>
          <WakSectionHeader eyebrow={t("Baseline")} title={t("Historical run")} />
          <StatusList items={status.baseline} />
          <div className="run-lock">
            <p>{t("Historical baseline is intentionally locked.")}</p>
            <span>
              {t("Performance metrics will appear only after the run-input freeze is complete.")}
            </span>
          </div>
        </WakPanel>
      </section>
    </>
  );
}
