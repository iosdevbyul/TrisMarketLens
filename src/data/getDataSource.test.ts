import { describe, expect, it } from "vitest";

import { HttpDataSource } from "./HttpDataSource";
import { mockDataSource } from "./MockDataSource";
import { createDataSource } from "./getDataSource";

describe("createDataSource", () => {
  it("uses mock data by default", () => {
    expect(createDataSource()).toBe(mockDataSource);
  });

  it("creates the HTTP adapter when explicitly configured", () => {
    expect(
      createDataSource({
        mode: "http",
        apiBaseUrl: "http://127.0.0.1:8000",
      }),
    ).toBeInstanceOf(HttpDataSource);
  });

  it("requires an API URL in HTTP mode", () => {
    expect(() => createDataSource({ mode: "http" })).toThrow(
      "DONGHAK_API_BASE_URL is required",
    );
  });

  it("rejects unsupported data source modes", () => {
    expect(() => createDataSource({ mode: "filesystem" })).toThrow(
      'Expected "mock" or "http"',
    );
  });
});
