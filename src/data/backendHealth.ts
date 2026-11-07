import {normalizeLocalBackendUrl} from "./localBackendUrl";
export type BackendHealth =
  | { status: "ok"; service: string; mode: "read_only" }
  | { status: "misconfigured"; detail: string }
  | { status: "unreachable"; detail: string };

export type HealthFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function checkBackendHealth(
  apiBaseUrl: string | undefined,
  fetcher: HealthFetcher = fetch,
): Promise<BackendHealth> {
  const baseUrl = normalizeLocalBackendUrl(apiBaseUrl);

  if (!baseUrl) {
    return {
      status: "misconfigured",
      detail: "DONGHAK_API_BASE_URL must be a local loopback HTTP endpoint in HTTP mode.",
    };
  }

  try {
    const response = await fetcher(baseUrl + "/api/v1/health", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        status: "unreachable",
        detail: `DonghakStockVision health returned HTTP ${response.status}.`,
      };
    }

    const payload: unknown = await response.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("status" in payload) ||
      payload.status !== "ok" ||
      !("service" in payload) ||
      payload.service !== "DonghakStockVision" ||
      !("mode" in payload) ||
      payload.mode !== "read_only"
    ) {
      return {
        status: "unreachable",
        detail: "DonghakStockVision health returned an unexpected payload.",
      };
    }

    return {
      status: "ok",
      service: payload.service,
      mode: "read_only",
    };
  } catch {
    return {
      status: "unreachable",
      detail: "DonghakStockVision health request failed or timed out.",
    };
  }
}
