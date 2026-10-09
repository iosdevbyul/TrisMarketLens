import type { DataSource } from "./DataSource";
import { HttpDataSource } from "./HttpDataSource";
import { mockDataSource } from "./MockDataSource";

export type DataSourceMode = "mock" | "http";

export interface DataSourceConfig {
  mode?: string;
  apiBaseUrl?: string;
}

export function createDataSource({
  mode = "mock",
  apiBaseUrl,
}: DataSourceConfig = {}): DataSource {
  if (mode === "mock") {
    return mockDataSource;
  }

  if (mode === "http") {
    if (!apiBaseUrl?.trim()) {
      throw new Error(
        "DONGHAK_API_BASE_URL is required when MARKET_LENS_DATA_SOURCE=http.",
      );
    }

    return new HttpDataSource(apiBaseUrl);
  }

  throw new Error(
    'Unsupported MARKET_LENS_DATA_SOURCE "' +
      mode +
      '". Expected "mock" or "http".',
  );
}

export function getDataSource(): DataSource {
  return createDataSource({
    mode: process.env.MARKET_LENS_DATA_SOURCE ?? "mock",
    apiBaseUrl: process.env.DONGHAK_API_BASE_URL,
  });
}
