import type { ResearchSourceRow } from "./researchSourceStatus";

export type ResearchDiagnosticAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  severity: "review" | "info";
};

/** Links to existing read-only views. Never represents a recommended action as an automated repair. */
export function researchDiagnosticActions(rows: readonly ResearchSourceRow[]): ResearchDiagnosticAction[] {
  const result: ResearchDiagnosticAction[] = [];
  for (const row of rows) {
    if (row.id === "backend" && (row.status === "unavailable" || row.status === "disconnected" || row.status === "demo")) {
      result.push({
        id: "backend",
        title: "Verify the local market API connection",
        description: "Confirm the explicitly configured loopback backend and read-only health contract. Do not treat demo mode as live collection.",
        href: "/diagnostics", severity: "review",
      });
    }
    if (row.id === "model" && (row.status === "unavailable" || row.status === "disconnected")) {
      result.push({
        id: "model",
        title: "Inspect research LLM management access",
        description: "Check server-only management endpoint configuration and read permissions. Never paste a bearer token into the browser.",
        href: "/ai-research-models", severity: "review",
      });
    }
    if (row.id === "comparison" && row.status === "unavailable") {
      result.push({
        id: "comparisons",
        title: "Review independent comparison publication",
        description: "The comparison endpoint may fail even when the registered model catalog is readable. No inferred fallback counts are shown.",
        href: "/ai-research-models", severity: "review",
      });
    }
    if (row.id === "daily" && (row.status === "unavailable" || row.status === "disconnected")) {
      result.push({
        id: "daily",
        title: "Inspect the selected ticker's daily publication",
        description: "Confirm the separate daily-research source mode and the published series contract. No missing research is replaced with mock records.",
        href: row.href, severity: "review",
      });
    }
    if (row.id === "daily" && row.status === "not_checked") {
      result.push({
        id: "ticker",
        title: "Select a ticker to inspect daily research",
        description: "Enter a six-character ticker to request an independently validated 10-record preview.",
        href: "/research-status", severity: "info",
      });
    }
  }
  return result;
}
