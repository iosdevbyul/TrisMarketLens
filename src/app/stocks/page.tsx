import { PageHeader } from "@/components/common/PageHeader";
import { WakMetricCard } from "@/components/design-system/WakMetricCard";
import { WakPanel } from "@/components/design-system/WakPanel";
import { WakSectionHeader } from "@/components/design-system/WakSectionHeader";
import { StockExplorer } from "@/components/stocks/StockExplorer";
import { getDataSource } from "@/data/getDataSource";

export default async function StocksPage() {
  const dataSource = getDataSource();
  const [coverage, stocks] = await Promise.all([
    dataSource.getCoverageSummary(),
    dataSource.getStocks(),
  ]);

  return (
    <>
      <PageHeader
        badge="Typed data source"
        description="Search the currently selected research data source. HTTP mode reads the reviewed DonghakStockVision snapshot without recreating research logic in the frontend."
        eyebrow="Market"
        title="Stocks"
      />

      <section className="metric-grid">
        <WakMetricCard label="Universe" value={coverage.universe.toLocaleString()} detail="Approved KOSPI securities" />
        <WakMetricCard label="Daily bars" value={coverage.totalBars.toLocaleString()} detail={`${coverage.startDate} through ${coverage.endDate}`} />
        <WakMetricCard label="Current identity" value={`${coverage.currentIdentityVerified}/${coverage.universe}`} detail="Official current corporation mapping" />
        <WakMetricCard label="Open lifecycle cases" value={String(coverage.unresolvedSecurities)} detail={`${coverage.unexplainedTickerSessions.toLocaleString()} unexplained sessions`} />
      </section>

      <WakPanel as="section" className="single-panel">
        <WakSectionHeader eyebrow="Stock explorer" title="Browse the current research universe" trailing={<span className="panel-count">DataSource</span>} />
        <StockExplorer stocks={stocks} />
      </WakPanel>
    </>
  );
}
