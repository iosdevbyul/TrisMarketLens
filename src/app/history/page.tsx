import { PageHeader } from "@/components/common/PageHeader";
import { getLocale, getTranslator } from "@/i18n/server";
import { getScreener } from "@/data/ScreenerDataSource";
import { summarizeAnalysisHistory } from "@/domain/analysisHistory";
import { AnalysisHistoryChart } from "@/components/dashboard/AnalysisHistoryChart";

export default async function AnalysisHistoryPage() {
  const [t, locale, result] = await Promise.all([getTranslator(), getLocale(), getScreener()]);
  const history = summarizeAnalysisHistory(result.data.entries);
  return <>
    <PageHeader eyebrow={t("AI research")} title={t("AI Analysis History")}
      badge={result.source === "mock" ? t("Demo data") : result.source === "http" ? t("API data") : t("Not connected")}
      description={t("Review observed daily model-analysis activity and validation state. This is not a backtest.")}/>
    {result.source === "mock" ? <div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("Historical counts here are fictional examples, not actual model runs.")}</span></div> : null}
    {result.error ? <div className="run-lock" role="alert"><p>{t("Screener unavailable")}</p><span>{result.error}</span></div> : null}
    <section className="panel single-panel" aria-label={t("AI Analysis History")}>
      <div className="panel-heading"><div><p className="eyebrow">{t("Historical activity")}</p><h2>{t("Analysis activity by date")}</h2></div>
        <span className="panel-count">{history.length} {t("observed dates")}</span></div>
      <AnalysisHistoryChart entries={history} locale={locale}/>
    </section>
  </>;
}
