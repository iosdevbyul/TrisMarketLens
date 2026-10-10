import { PageHeader } from "@/components/common/PageHeader";
import { getTranslator } from "@/i18n/server";
import { disconnectedOperations as operations } from "@/domain/operations";

/**
 * Frontend-only first phase. The backend will supply a validated snapshot through
 * a dedicated read-only endpoint; never synthesize live run history in the UI.
 */
export default async function OperationsPage() {
  const t = await getTranslator();
  const fields = [
    { label: "Engine connection", value: t("Not connected"), detail: "No operations API is configured yet." },
    { label: "Latest validated market data", value: "—", detail: "Available after a verified collection run." },
    { label: "Last completed analysis", value: "—", detail: "Available after a recorded analysis run." },
    { label: "Next scheduled analysis", value: "—", detail: "Available after scheduler integration." },
  ];
  return (
    <>
      <PageHeader eyebrow={t("Operations")} title={t("Analysis operations")} badge={t("Frontend ready")}
        description={t("This screen will track scheduled collection, validation, model inference, and job history independently from the research dashboard.")} />
      <section className="operations-grid" aria-label={t("Analysis operations")}>
        {fields.map(field => (
          <article className="metric-card" key={field.label}>
            <p className="metric-label">{t(field.label)}</p>
            <p className="metric-value">{field.value}</p>
            <p className="metric-detail">{t(field.detail)}</p>
          </article>
        ))}
      </section>
      <section className="panel single-panel" aria-label={t("Analysis run history")}>
        <div className="panel-heading">
          <div><p className="eyebrow">{t("Run history")}</p><h2>{t("Analysis run history")}</h2></div>
          <span className="panel-count">{operations.runs.length} {t("runs")}</span>
        </div>
        {operations.runs.length === 0 ? (
          <div className="run-lock">
            <p>{t("No analysis runs available")}</p>
            <span>{t("TrisMarketLens does not execute or simulate analysis. Run history will be displayed only when DonghakStockVision provides verified operational records.")}</span>
          </div>
        ) : null}
      </section>
      <section className="panel single-panel">
        <p className="eyebrow">{t("Integration contract")}</p>
        <h2>{t("Backend integration pending")}</h2>
        <p className="section-copy">{t("The planned read-only operations API will provide job identifiers, queued and completed states, timestamps, latest validated trading date, scheduler information, and failure details. No market data or predictions are fabricated.")}</p>
      </section>
    </>
  );
}
