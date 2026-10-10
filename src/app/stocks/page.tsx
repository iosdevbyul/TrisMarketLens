import { getLocale, getTranslator } from "@/i18n/server";
import { PageHeader } from "@/components/common/PageHeader";
import { WakMetricCard } from "@/components/design-system/WakMetricCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { StockExplorer } from "@/components/stocks/StockExplorer";
import { getDataSource } from "@/data/getDataSource";

export default async function StocksPage() {
  const t = await getTranslator();
  const dataSource = getDataSource();
  const [coverage, stocks] = await Promise.all([
    dataSource.getCoverageSummary(),
    dataSource.getStocks(),
  ]);

  return (
    <>
      <PageHeader
        badge={t("Typed data source")}
        description={t("Search the currently selected research data source. HTTP mode reads the reviewed DonghakStockVision snapshot without recreating research logic in the frontend.")}
        eyebrow={t("Market")}
        title={t("Stocks")}
      />

      <section className="metric-grid">
        <WakMetricCard label={t("Universe")} value={coverage.universe.toLocaleString()} detail={t("Approved KOSPI securities")} />
        <WakMetricCard label={t("Daily bars")} value={coverage.totalBars.toLocaleString()} detail={`${coverage.startDate} through ${coverage.endDate}`} />
        <WakMetricCard label={t("Current identity")} value={`${coverage.currentIdentityVerified}/${coverage.universe}`} detail={t("Official current corporation mapping")} />
        <WakMetricCard label={t("Open lifecycle cases")} value={String(coverage.unresolvedSecurities)} detail={`${coverage.unexplainedTickerSessions.toLocaleString()} unexplained sessions`} />
      </section>

      <WakPanel as="section" className="single-panel">
        <WakSectionHeader eyebrow={t("Stock explorer")} title={t("Browse the current research universe")} trailing={<span className="panel-count">{t("DataSource")}</span>} />
        <StockExplorer stocks={stocks} locale={await getLocale()} />
      </WakPanel>
    </>
  );
}
