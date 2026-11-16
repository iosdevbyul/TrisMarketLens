import { Localize } from "@/i18n/Localize";
import { getTranslator } from "@/i18n/server";
import type { DailyResearchRecord } from "@/domain/dailyResearch";
import { compareVisibleResearchModels } from "@/domain/researchModelEvidenceComparison";

/** Source-separated descriptive comparison, never a performance ranking. */
export async function ResearchModelEvidenceComparison({
  records,
  totalRecords,
  scope = "page",
}: {
  records: readonly DailyResearchRecord[];
  totalRecords: number;
  scope?: "page" | "complete" | "limited";
}) {
  const t=await getTranslator();
  const rows = compareVisibleResearchModels(records);
  return (
    <section className="panel single-panel" aria-label="Research model evidence comparison">
      <div className="panel-heading">
        <div>
          <p className="eyebrow"><Localize text="Research evidence" /></p>
          <h2><Localize text="Model activity comparison" /></h2>
        </div>
        <span className="panel-count">{rows.length} {t("model/source groups")}</span>
      </div>
      <p className="section-copy">
        {t(scope === "page" ? "These counts compare only the currently displayed response page." : scope === "limited" ? "These counts cover only the first bounded slice of matching published records." : "These counts cover all records matching the requested published date range.")}
        {" "}{t("Retrieved published research records:")} {records.length} / {totalRecords}. {t("Model versions and real or synthetic origins are separate. Completed jobs are not verified predictions; research scores are not calibrated probabilities. No accuracy, profit or model ranking is inferred.")}
      </p>
      {!rows.length ? (
        <div className="empty-state"><p><Localize text="No comparable records on this page" /></p><span><Localize text="Try another date range or page. Missing records are not treated as zero performance." /></span></div>
      ) : (
        <div className="stock-table" style={{ overflowX: "auto", marginTop: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px", textAlign: "left" }}>
            <thead>
              <tr>
                {["Model / version", "Data origin", "Trading-date coverage", "Jobs", "Completed", "Pending", "Blocked", "Failed", "Scores recorded"].map((heading) =>
                  <th scope="col" key={heading} style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>{t(heading)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={JSON.stringify([row.modelId, row.modelVersion, row.origin])}>
                  <th scope="row" style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>
                    {row.modelId}<div className="metric-detail">{row.modelVersion}</div>
                  </th>
                  <td style={{ padding: "12px 10px" }}>{t(row.origin === "real" ? "Real provider record" : "Synthetic fixture")}</td>
                  <td style={{ padding: "12px 10px" }}>{row.firstTradingDate} – {row.lastTradingDate}</td>
                  <td style={{ padding: "12px 10px" }}>{row.count}</td>
                  <td style={{ padding: "12px 10px" }}>{row.completed}</td>
                  <td style={{ padding: "12px 10px" }}>{row.pending}</td>
                  <td style={{ padding: "12px 10px" }}>{row.blocked}</td>
                  <td style={{ padding: "12px 10px" }}>{row.failed}</td>
                  <td style={{ padding: "12px 10px" }}>{row.scoreRecorded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 ? <details style={{ marginTop: "16px" }}>
        <summary><Localize text="Inspect recorded research directions by model" /></summary>
        <div className="status-list" style={{ marginTop: "12px" }}>
          {rows.map((row) => <div className="status-row" key={JSON.stringify([row.modelId, row.modelVersion, row.origin])}>
            <div>
              <p className="status-title">{row.modelId} · {row.modelVersion} · {row.origin}</p>
              <p className="status-detail">{t("Completed output labels only:")} {t("Up:")} {row.directions.up}, {t("Down:")} {row.directions.down}, {t("Neutral:")} {row.directions.neutral}. {t("These are not outcome evaluations.")}</p>
            </div>
          </div>)}
        </div>
      </details> : null}
    </section>
  );
}
