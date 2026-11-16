import type { DailyResearchRecord } from "@/domain/dailyResearch";
import { compareVisibleResearchModels } from "@/domain/researchModelEvidenceComparison";

/** Source-separated descriptive comparison, never a performance ranking. */
export function ResearchModelEvidenceComparison({
  records,
  totalRecords,
}: {
  records: readonly DailyResearchRecord[];
  totalRecords: number;
}) {
  const rows = compareVisibleResearchModels(records);
  return (
    <section className="panel single-panel" aria-label="Research model evidence comparison">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Research evidence</p>
          <h2>Model activity comparison</h2>
        </div>
        <span className="panel-count">{rows.length} model/source groups</span>
      </div>
      <p className="section-copy">
        These counts compare only the {records.length} records on the currently displayed page
        of {totalRecords} retained records. Model versions and real/synthetic origins are kept
        separate. Completed jobs are not verified predictions; research scores are not calibrated
        probabilities, and no accuracy, profit, or model ranking is inferred.
      </p>
      {!rows.length ? (
        <div className="empty-state"><p>No comparable records on this page</p><span>Try another date range or page. Missing records are not treated as zero performance.</span></div>
      ) : (
        <div className="stock-table" style={{ overflowX: "auto", marginTop: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px", textAlign: "left" }}>
            <thead>
              <tr>
                {["Model / version", "Data origin", "Trading-date coverage", "Jobs", "Completed", "Pending", "Blocked", "Failed", "Scores recorded"].map((heading) =>
                  <th scope="col" key={heading} style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>{heading}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={JSON.stringify([row.modelId, row.modelVersion, row.origin])}>
                  <th scope="row" style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>
                    {row.modelId}<div className="metric-detail">{row.modelVersion}</div>
                  </th>
                  <td style={{ padding: "12px 10px" }}>{row.origin === "real" ? "Real provider record" : "Synthetic fixture"}</td>
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
        <summary>Inspect recorded research directions by model</summary>
        <div className="status-list" style={{ marginTop: "12px" }}>
          {rows.map((row) => <div className="status-row" key={JSON.stringify([row.modelId, row.modelVersion, row.origin])}>
            <div>
              <p className="status-title">{row.modelId} · {row.modelVersion} · {row.origin}</p>
              <p className="status-detail">Completed output labels only — Up: {row.directions.up}, Down: {row.directions.down}, Neutral: {row.directions.neutral}. These are not outcome evaluations.</p>
            </div>
          </div>)}
        </div>
      </details> : null}
    </section>
  );
}
