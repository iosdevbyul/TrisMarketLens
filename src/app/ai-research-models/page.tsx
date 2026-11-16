import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { AIResearchComparisonGroups } from "@/components/research/AIResearchComparisonGroups";
import { requestModelValidation, selectValidatedResearchModel } from "./actions";
import { getAIManagementSnapshot, getAIManagementValidation, safeLabel, stringValue, type AIManagementRecord } from "@/data/AIModelManagementDataSource";

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

export default async function AIResearchModelsPage({ searchParams }: { searchParams: Promise<{ notice?: string; job?: string }> }) {
  const query = await searchParams;
  const snapshot = await getAIManagementSnapshot();
  const validation = query.job ? await getAIManagementValidation(query.job) : null;
  const active = snapshot.active;
  return (
    <>
      <Link href="/models" className="back-link">← Back to stock-direction model evidence</Link>
      <PageHeader
        eyebrow="Research infrastructure"
        title="AI research LLMs"
        badge={snapshot.state === "available" ? "Authenticated operator controls" : "Not connected"}
        description="Inspect the language models that propose bounded research experiments. These are not trained stock-direction models, and changing one never approves a trading decision."
      />
      <section className="panel single-panel" aria-label="AI management connection">
        <div className="panel-heading"><h2>Management connection</h2><span className="panel-count">{snapshot.state}</span></div>
        <p className="section-copy" role={snapshot.state === "available" ? undefined : "status"}>{snapshot.message}</p>
        <p className="metric-detail">The page reads management status through server-side GET requests. Its separate, explicitly approved controls can request model validation or selection; neither action starts a study, changes a stock prediction model, or activates trading. Backend credentials remain server-side.</p>
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
      <section className="panel single-panel" aria-label="Validate or select research model">
        <div className="panel-heading"><h2>Validate and select research LLM</h2><span className="panel-count">Explicit approval required</span></div>
        <p className="section-copy">These controls affect only the next explicitly managed research run, never an ongoing worker, stock prediction model, broker, or scheduler. A validation can load a local model and consume CPU; do not retry while it is running.</p>
        {query.notice ? <p role="status" className="section-copy">{({
          "invalid-model": "Select a valid model key.",
          "connection-error": "Management is disconnected. No request was made.",
          "unknown-model": "The requested model is not registered in the current catalog.",
          "invalid-request": "The submitted model, receipt or selection version was invalid.",
          "approval-required": "Explicit approval is required. Selection was not changed.",
          "invalid-response": "The backend returned an invalid validation job identifier.",
          "validation-started": "Validation was accepted. Check the job outcome below before selecting a model.",
          "selection-submitted": "The backend accepted the model selection. Refresh the active status to verify.",
          "backend-401": "Backend rejected authentication.",
          "backend-403": "The configured token lacks management permission.",
          "backend-409": "Management is busy or the selection changed. Refresh and retry.",
          "backend-413": "Request exceeded backend limits.",
          "backend-422": "Backend rejected the model or validation receipt.",
          "backend-503": "AI management is not available.",
        } as Record<string, string>)[query.notice] ?? "AI management operation could not be completed."}</p> : null}
        {snapshot.state === "available" && snapshot.models.length > 0 ? (
          <form action={requestModelValidation} className="stock-explorer">
            <label htmlFor="validation-model">Model to validate</label>
            <select id="validation-model" name="modelKey" required>
              {snapshot.models.filter((model) => typeof (model.key ?? model.modelKey) === "string").map((model, index) => (
                <option key={index} value={String(model.key ?? model.modelKey)}>
                  {title(model, "displayName", "display_name", "modelId", "model_id", "key")}
                </option>
              ))}
            </select>
            <button type="submit">Request model validation</button>
          </form>
        ) : <p className="section-copy">Validation controls require an authenticated catalog with registered model keys.</p>}
        {query.job ? (
          <div className="run-lock">
            <p>Validation job</p>
            {validation ? (
              <>
                <span>Job: {query.job} · State: {detail(validation, "state")}</span>
                <span>Model: {detail(validation, "modelKey")} · Valid: {detail(validation, "valid")} · Unloaded: {detail(validation, "unloaded")}</span>
                <span>Reason: {detail(validation, "reason")} · Expires: {detail(validation, "expiresAt")}</span>
              </>
            ) : <span>Job not available, invalid or no longer accessible.</span>}
            <span><Link href={"/ai-research-models?job=" + encodeURIComponent(query.job)}>Refresh validation status</Link></span>
          </div>
        ) : null}
        {snapshot.state === "available" && snapshot.active && validation?.state === "completed" && validation.valid === true &&
          typeof validation.modelKey === "string" && typeof validation.validationId === "string" &&
          Number.isSafeInteger(snapshot.active.selectionVersion) && Number(snapshot.active.selectionVersion) >= 0 ? (
          <form action={selectValidatedResearchModel} className="stock-explorer">
            <input type="hidden" name="modelKey" value={validation.modelKey} />
            <input type="hidden" name="validationId" value={validation.validationId} />
            <input type="hidden" name="expectedSelectionVersion" value={String(snapshot.active.selectionVersion)} />
            <p className="section-copy">Validated model: <strong>{validation.modelKey}</strong>. Current selection version: {String(snapshot.active.selectionVersion)}. A fresh validation receipt and unchanged backend selection version are required.</p>
            <label><input type="checkbox" name="approve" value="yes" required /> I approve selecting this model for the next managed research run.</label>
            <button type="submit" disabled={snapshot.active.busy === true}>Select validated research LLM</button>
          </form>
        ) : null}
      </section>
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
      <AIResearchComparisonGroups records={snapshot.comparisons} available={snapshot.state === "available" && !snapshot.partialErrors.includes("Research comparisons are currently unavailable.")} />
    </>
  );
}
