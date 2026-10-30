import Link from "next/link";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";
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
  const [status, screener, locale, operational] = await Promise.all([dataSource.getProjectStatus(), getScreener(), getLocale(), process.env.MARKET_LENS_DATA_SOURCE==="http"?loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL):Promise.resolve({data:null,error:"Live operational HTTP data is not enabled"})]);

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

      <WakPanel as="section" className="single-panel">
        <WakSectionHeader eyebrow="Live data source" title="Collected KRX observations" trailing={<span className="panel-count">Unreviewed operational data</span>} />
        <p className="section-copy">Separate from research coverage and model approval. This reports the configured operational snapshot only.</p>
        {operational.data ? <>
          <div className="metric-grid"><WakMetricCard label="Observed tickers" value={operational.data.total.toLocaleString(locale==="ko"?"ko-KR":"en-US")} detail="Count returned by the read-only operational API" /></div>
          {operational.data.items.length>0 ? <div className="operations-runs">
            {operational.data.items.slice(0,5).map(item=><article className="operations-run" key={item.ticker}>
              <div><strong><Link href={"/operational-market/"+item.ticker}>{item.ticker}</Link></strong><p className="metric-detail">Latest observed: {item.latestDataDate}</p></div>
            </article>)}
          </div> : <p className="section-copy">This snapshot contains no observed tickers.</p>}
        </> : <p className="metric-detail" role="status">Collected data unavailable: {operational.error}</p>}
        <Link href="/operational-market">Browse collected KRX prices</Link>
      </WakPanel>
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
