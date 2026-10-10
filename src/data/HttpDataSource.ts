import type { BaselineBacktestSnapshot } from "@/domain/backtest";
import type {
  EvidenceDetail,
  EvidenceLayerId,
  EvidenceLayerSummary,
} from "@/domain/evidence";
import type { ProjectStatus } from "@/domain/project";
import type {
  CoverageSummary,
  ModelDetail,
  ModelDirection,
  ModelSummary,
} from "@/domain/research";
import type { StockDetail, StockSummary } from "@/domain/stock";

import type { DataSource } from "./DataSource";
import {isBaseline,isCoverage,isEvidenceDetail,isEvidenceSummary,isModelDetail,isModelSummary,isProjectStatus,isStockDetail,isStockSummary} from "./researchResponseValidators";

export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class HttpDataSourceError extends Error {
  readonly status: number;
  readonly url: string;
  readonly responseBody: string | null;

  constructor({
    message,
    status,
    url,
    responseBody = null,
  }: {
    message: string;
    status: number;
    url: string;
    responseBody?: string | null;
  }) {
    super(message);
    this.name = "HttpDataSourceError";
    this.status = status;
    this.url = url;
    this.responseBody = responseBody;
  }
}

export class HttpDataSource implements DataSource {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(baseUrl: string, fetcher: Fetcher = fetch) {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");

    if (!normalizedBaseUrl) {
      throw new Error("DonghakStockVision API base URL is required.");
    }

    this.baseUrl = normalizedBaseUrl;
    this.fetcher = fetcher;
  }

  getProjectStatus() {
    return this.request<ProjectStatus>("/api/v1/project/status", isProjectStatus);
  }

  getCoverageSummary() {
    return this.request<CoverageSummary>("/api/v1/research/coverage", isCoverage);
  }

  getModelSummaries() {
    return this.request<ModelSummary[]>("/api/v1/models", (v): v is ModelSummary[] => Array.isArray(v) && v.every(isModelSummary));
  }

  getModel(direction: ModelDirection) {
    return this.requestNullable<ModelDetail>(
      "/api/v1/models/" + encodeURIComponent(direction),
      isModelDetail,
    );
  }

  getEvidenceLayers() {
    return this.request<EvidenceLayerSummary[]>("/api/v1/evidence", (v): v is EvidenceLayerSummary[] => Array.isArray(v) && v.every(isEvidenceSummary));
  }

  getEvidenceLayer(id: EvidenceLayerId) {
    return this.requestNullable<EvidenceDetail>(
      "/api/v1/evidence/" + encodeURIComponent(id),
      isEvidenceDetail,
    );
  }

  getBaselineBacktest() {
    return this.request<BaselineBacktestSnapshot>("/api/v1/backtests/baseline", isBaseline);
  }

  getStocks() {
    return this.request<StockSummary[]>("/api/v1/stocks", (v): v is StockSummary[] => Array.isArray(v) && v.every(isStockSummary));
  }

  getStock(ticker: string) {
    return this.requestNullable<StockDetail>(
      "/api/v1/stocks/" + encodeURIComponent(ticker),
      isStockDetail,
    );
  }

  private request<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    return this.performRequest<T>(path, false, validate) as Promise<T>;
  }

  private requestNullable<T>(path: string, validate: (value: unknown) => value is T): Promise<T | null> {
    return this.performRequest<T>(path, true, validate);
  }

  private async performRequest<T>(
    path: string,
    nullable404: boolean,
    validate: (value: unknown) => value is T,
  ): Promise<T | null> {
    const url = this.baseUrl + path;
    let response: Response;

    try {
      response = await this.fetcher(url, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      throw new HttpDataSourceError({
        message:
          error instanceof Error
            ? "DonghakStockVision API request failed: " + error.message
            : "DonghakStockVision API request failed.",
        status: 0,
        url,
      });
    }

    if (response.status === 404 && nullable404) {
      return null;
    }

    if (!response.ok) {
      const responseBody = await response.text().catch(() => null);

      throw new HttpDataSourceError({
        message:
          "DonghakStockVision API returned HTTP " +
          response.status +
          " for " +
          path +
          ".",
        status: response.status,
        url,
        responseBody,
      });
    }

    try {
      const payload: unknown = await response.json();
      if (!validate(payload)) {
        throw new HttpDataSourceError({message: "DonghakStockVision API returned invalid response shape for " + path + ".", status: response.status, url});
      }
      return payload;
    } catch (error) {
      if (error instanceof HttpDataSourceError) throw error;
      throw new HttpDataSourceError({
        message: "DonghakStockVision API returned invalid JSON for " + path + ".",
        status: response.status,
        url,
      });
    }
  }
}
