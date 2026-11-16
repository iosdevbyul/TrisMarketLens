import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getAIManagementSnapshot, safeLabel, stringValue, type AIManagementRecord } from "@/data/AIModelManagementDataSource";

export const dynamic = "force-dynamic";

function detail(item: AIManagementRecord, ...keys: string[]): string {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return safeLabel(item[key]);
  }
  return "Not reported";
}

function title(item: AIManagementRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = stringValue(item[key]);
    if (value) return value.slice(0, 140);
  }
  return "Unnamed record";
}

export default async function AIResearchModelsPage() {
  const snapshot = await getAIManagementSnapshot();
  const active = snapshot.active;
  return (
    <>
      <Link href="/models" className="back-link">← Back to stock-direction model evidence</Link>
      <PageHeader
        eyebrow="Research infrastructure"
        title="AI research LLMs"
        badge={snapshot.state === "available" ? "Read-only · authenticated" : "Not connected"}
        description="Inspect the language models that propose bounded research experiments. These are not trained stock-direction models, and changing one never approves a trading decision."
      />
      <section className="panel single-panel" aria-label="AI management connection">
        <div className="panel-heading"><h2>Management connection</h2><span className="panel-count">{snapshot.state}</span></div>
        <p className="section-copy" role={snapshot.state === "available" ? undefined : "status"}>{snapshot.message}</p>
        <p className="metric-detail">This page performs authenticated server-side GET requests only. It does not start validation, switch models, launch studies, or activate trading. Backend credentials are never sent to the browser.</p>
        {snapshot.partialErrors.map((error) => <p key={error} role="status" className="metric-detail">{error}</p>)}
      </section>
      {active && (
        <section className="panel single-panel" aria-label="Selected AI research model">
          <div className="panel-heading"><h2>Current research LLM selection</h2><span className="panel-count">Next managed run</span></div>
          <div className="operations-overview-grid">
            <div className="operations-overview-stat"><span>Selected model key</span><strong>{detail(active, "selectedModelKey")}</strong></div>
            <div className="operations-overview-stat"><span>Default model key</span><strong>{detail(active, "defaultModelKey")}</strong></div>
            <div className="operations-overview-stat"><span>Selection version</span><strong>{detail(active, "selectionVersion")}</strong></div>
            <div className="operations-overview-stat"><span>Busy</span><strong>{detail(active, "busy")}</strong></div>
          </div>
          <p className="section-copy">Selection becomes effective on the next explicitly managed research run. It does not replace a model already running or imply a successful proposal.</p>
          <p className="metric-detail">Last applied research model: {active.lastApplied === null || active.lastApplied === undefined ? "None recorded" : title(active.lastApplied as AIManagementRecord, "modelKey", "modelId", "model_id")}</p>
        </section>
      )}
      <section className="panel single-panel" aria-label="Registered research LLM catalog">
        <div className="panel-heading"><h2>Research LLM catalog</h2><span className="panel-count">{snapshot.state === "available" ? snapshot.models.length + " returned" : "Unavailable"}</span></div>
        {snapshot.state === "available" && snapshot.models.length === 0 ? <div className="empty-state"><p>No catalog entries returned</p><span>No model is presumed installed or ready.</span></div> : null}
        <div className="status-list">
          {snapshot.models.map((model, index) => (
            <div className="status-row" key={title(model, "key", "modelKey", "model_id", "modelId") + index}>
              <div>
                <p className="status-title">{title(model, "displayName", "display_name", "modelId", "model_id", "key")}</p>
                <p className="status-detail">Key: {detail(model, "key", "modelKey")} · Provider: {detail(model, "providerId", "provider_id")} · Revision: {detail(model, "revision")}</p>
                <p className="status-detail">Installed: {detail(model, "installed")} · Available: {detail(model, "available")} · Executable: {detail(model, "executable")}</p>
              </div>
              <span className="panel-count">{detail(model, "selected") === "Yes" ? "Selected" : "Catalog"}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel single-panel" aria-label="Research LLM change history">
        <div className="panel-heading"><h2>Selection history</h2><span className="panel-count">{snapshot.state === "available" ? snapshot.history.length + " records" : "Unavailable"}</span></div>
        {snapshot.history.length ? snapshot.history.map((item, index) => <div key={index} className="status-row"><div><p className="status-title">{title(item, "modelKey", "selectedModelKey", "action", "outcome")}</p><p className="status-detail">Outcome: {detail(item, "outcome", "status")} · At: {detail(item, "changedAt", "createdAt", "timestamp")} · Version: {detail(item, "selectionVersion")}</p></div></div>) : <p className="section-copy">No selection history is available. This is not evidence that no model changes ever occurred.</p>}
      </section>
      <section className="panel single-panel" aria-label="Comparable research outcomes">
        <div className="panel-heading"><h2>Research model comparisons</h2><span className="panel-count">{snapshot.state === "available" ? snapshot.comparisons.length + " records" : "Unavailable"}</span></div>
        {snapshot.comparisons.length ? snapshot.comparisons.map((item, index) => <div key={index} className="status-row"><div><p className="status-title">{title(item, "modelKey", "modelId", "studyId", "comparisonContractId")}</p><p className="status-detail">Contract: {detail(item, "comparisonContractId")} · State: {detail(item, "status", "outcome")} · Run: {detail(item, "runId")}</p></div></div>) : <p className="section-copy">No comparison records are available. Only identical comparison contract IDs can support matched comparisons; research metrics do not establish live investment performance.</p>}
      </section>
    </>
  );
}
