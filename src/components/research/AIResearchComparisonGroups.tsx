import { classifyResearchComparisons, comparisonModelKey, type RawResearchComparison } from "@/domain/aiResearchComparisonGroups";

function field(record: RawResearchComparison, key: string): string {
  const value = record[key];
  if (typeof value === "string" && value.trim()) return value.slice(0, 160);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return "Not reported";
}

export function AIResearchComparisonGroups({ records, available }: {
  records: readonly RawResearchComparison[];
  available: boolean;
}) {
  const groups = classifyResearchComparisons(records);
  return (
    <section className="panel single-panel" aria-label="Research LLM comparison contracts">
      <div className="panel-heading">
        <div><p className="eyebrow">Managed research</p><h2>Contract-matched research comparisons</h2></div>
        <span className="panel-count">{available ? groups.total + " retained records" : "Unavailable"}</span>
      </div>
      <p className="section-copy">
        Research runs are grouped only when the backend reports an identical comparisonContractId.
        A shared contract permits inspection of matched research conditions, not a claim that one model
        has higher forecast accuracy. Contract IDs with no matches and records without a contract
        never contribute to an across-study leaderboard.
      </p>
      {!available ? <p className="section-copy" role="status">The authenticated management comparison API is not available.</p> : null}
      {available && groups.total === 0 ? <div className="empty-state"><p>No research comparison records returned</p><span>Missing records do not imply that a comparison was performed.</span></div> : null}
      {groups.comparable.map((group) => (
        <article className="status-list" key={group.contractId} style={{ marginTop: "16px" }}>
          <div className="status-row">
            <div>
              <p className="status-title">Comparison contract: <code>{group.contractId}</code></p>
              <p className="status-detail">{group.runCount} retained entries · {group.modelKeys.length} reported model identities</p>
            </div>
            <span className="panel-count">{group.runCount < 2 ? "Single run" : "Matched contract"}</span>
          </div>
          <div className="stock-table" style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "660px", width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr>
                {["Model identity", "Run", "State", "Recorded outcome"].map((column) => (
                  <th key={column} scope="col" style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{column}</th>
                ))}
              </tr></thead>
              <tbody>
                {group.records.map((record, index) => <tr key={index}>
                  <th scope="row" style={{ padding: "12px" }}>{comparisonModelKey(record) ?? "Not reported"}</th>
                  <td style={{ padding: "12px" }}>{field(record, "runId")}</td>
                  <td style={{ padding: "12px" }}>{field(record, "status") === "Not reported" ? field(record, "outcome") : field(record, "status")}</td>
                  <td style={{ padding: "12px" }}>{field(record, "reason")}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <p className="metric-detail" style={{ padding: "12px" }}>
            {group.runCount === 1
              ? "Only one retained result has this contract; no matched run-to-run comparison is available."
              : "Matching contracts establish comparable conditions, not independent Final Test validation, live predictions or trading authorization."}
          </p>
        </article>
      ))}
      {groups.unclassified.length > 0 ? <div className="run-lock" role="status">
        <p>{groups.unclassified.length} records cannot be matched to a comparison contract</p>
        <span>Those records are excluded from matched groups because their contract identity is absent or invalid. No substitute fingerprint is derived.</span>
      </div> : null}
      {available && groups.total > 0 ? <p className="metric-detail">
        Models from different contract IDs are not directly compared, even if their reported metrics or labels look similar.
        Local research comparisons do not certify future performance.
      </p> : null}
    </section>
  );
}
