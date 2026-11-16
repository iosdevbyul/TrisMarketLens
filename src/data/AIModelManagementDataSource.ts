import "server-only";

export type AIManagementState = "unconfigured" | "available" | "unavailable" | "unauthorized" | "forbidden";
export type AIManagementRecord = Record<string, unknown>;
export type AIManagementSnapshot = {
  state: AIManagementState;
  message: string;
  models: AIManagementRecord[];
  active: AIManagementRecord | null;
  history: AIManagementRecord[];
  comparisons: AIManagementRecord[];
  partialErrors: string[];
};

export function record(value: unknown): AIManagementRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as AIManagementRecord : null;
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function safeLabel(value: unknown): string {
  if (typeof value === "string") return value.length > 140 ? value.slice(0, 140) + "…" : value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "Not reported";
}

export function recordArray(body: unknown, keys: string[]): AIManagementRecord[] {
  const root = record(body);
  const values: unknown = Array.isArray(body) ? body : keys.map((key) => root?.[key]).find(Array.isArray);
  return Array.isArray(values) ? values.map(record).filter((item): item is AIManagementRecord => item !== null).slice(0, 100) : [];
}

function localBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function empty(state: AIManagementState, message: string): AIManagementSnapshot {
  return { state, message, models: [], active: null, history: [], comparisons: [], partialErrors: [] };
}

async function fetchManagement(path: string, origin: string, token: string): Promise<unknown> {
  const response = await fetch(origin + path, {
    headers: { Accept: "application/json", Authorization: "Bearer " + token },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (response.status === 401) throw new ManagementError("unauthorized");
  if (response.status === 403) throw new ManagementError("forbidden");
  if (!response.ok) throw new ManagementError("unavailable");
  return response.json() as Promise<unknown>;
}

class ManagementError extends Error {
  constructor(readonly kind: AIManagementState) { super(kind); }
}

/** Server-only, read-only observation. Never forwards credentials or performs mutations. */
export async function getAIManagementSnapshot(): Promise<AIManagementSnapshot> {
  const configuredUrl = process.env.DONGHAK_AI_MANAGEMENT_BASE_URL;
  const token = process.env.DONGHAK_AI_MANAGEMENT_TOKEN;
  if (!configuredUrl && !token) return empty("unconfigured", "AI research LLM management is not configured on this web server.");
  const origin = localBaseUrl(configuredUrl);
  if (!origin) return empty("unavailable", "AI management requires an explicit http://127.0.0.1:<port>/ endpoint.");
  if (!token?.trim()) return empty("unconfigured", "A server-side AI management read token is required.");

  let catalog: unknown;
  let active: unknown;
  try {
    [catalog, active] = await Promise.all([
      fetchManagement("/api/v1/ai/models", origin, token),
      fetchManagement("/api/v1/ai/models/active", origin, token),
    ]);
  } catch (error) {
    const kind = error instanceof ManagementError ? error.kind : "unavailable";
    const messages: Record<AIManagementState, string> = {
      unconfigured: "Management is not configured.",
      available: "Connected.",
      unavailable: "AI management backend is unavailable or returned an invalid response.",
      unauthorized: "AI management authentication was rejected.",
      forbidden: "The configured token lacks AI management read permission.",
    };
    return empty(kind, messages[kind]);
  }
  const activeRecord = record(active);
  if (!activeRecord || !record(catalog)) return empty("unavailable", "AI management returned an unsupported response.");
  const optional = await Promise.allSettled([
    fetchManagement("/api/v1/ai/models/history", origin, token),
    fetchManagement("/api/v1/ai/models/comparisons", origin, token),
  ]);
  const partialErrors: string[] = [];
  if (optional[0].status === "rejected") partialErrors.push("Selection history is currently unavailable.");
  if (optional[1].status === "rejected") partialErrors.push("Research comparisons are currently unavailable.");
  return {
    state: "available",
    message: "Authenticated read-only management status.",
    models: recordArray(catalog, ["models", "items", "entries"]),
    active: activeRecord,
    history: optional[0].status === "fulfilled" ? recordArray(optional[0].value, ["history", "items", "entries"]) : [],
    comparisons: optional[1].status === "fulfilled" ? recordArray(optional[1].value, ["comparisons", "items", "entries"]) : [],
    partialErrors,
  };
}


export type AIManagementOperationResult =
  | { ok: true; data: AIManagementRecord }
  | { ok: false; status: number; message: string };

/** Small server-only mutation gateway; arbitrary paths, origins, and credentials are not client supplied. */
export async function requestAIManagementOperation(
  operation: "validate" | "select",
  body: { modelKey: string } | { modelKey: string; validationId: string; expectedSelectionVersion: number; approve: true },
): Promise<AIManagementOperationResult> {
  const origin = localBaseUrl(process.env.DONGHAK_AI_MANAGEMENT_BASE_URL);
  const token = process.env.DONGHAK_AI_MANAGEMENT_TOKEN;
  if (!origin || !token?.trim()) return { ok: false, status: 503, message: "AI management is not configured." };
  try {
    const response = await fetch(origin + (operation === "validate" ? "/api/v1/ai/models/validate" : "/api/v1/ai/models/active"), {
      method: operation === "validate" ? "POST" : "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        401: "AI management authentication was rejected.",
        403: "The token lacks model management permission.",
        409: "Management is busy or the selection version has changed. Reload and retry.",
        413: "The management request exceeded backend limits.",
        422: "The model, validation receipt or approval was rejected.",
      };
      return { ok: false, status: response.status, message: messages[response.status] ?? "AI management rejected this request." };
    }
    const data: unknown = await response.json();
    const parsed = record(data);
    if (!parsed) return { ok: false, status: 502, message: "Backend returned an invalid management response." };
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, status: 503, message: "AI management backend is unreachable." };
  }
}

export async function getAIManagementValidation(jobId: string): Promise<AIManagementRecord | null> {
  if (!/^[0-9a-f]{64}$/i.test(jobId)) return null;
  const origin = localBaseUrl(process.env.DONGHAK_AI_MANAGEMENT_BASE_URL);
  const token = process.env.DONGHAK_AI_MANAGEMENT_TOKEN;
  if (!origin || !token?.trim()) return null;
  try {
    return record(await fetchManagement("/api/v1/ai/models/validations/" + jobId, origin, token));
  } catch {
    return null;
  }
}
