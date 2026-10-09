import { describe, expect, it, vi } from "vitest";

import { HttpDataSource, HttpDataSourceError } from "./HttpDataSource";

describe("HttpDataSource", () => {
  it("requests the expected endpoint without Next.js fetch caching", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        productName: "Tris Market Lens",
        sourceLabel: "HTTP",
        metrics: [],
        evidence: [],
        baseline: [],
      }),
    );
    const dataSource = new HttpDataSource("http://127.0.0.1:8000/", fetcher);

    await dataSource.getProjectStatus();

    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/project/status",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("maps a detail 404 to null", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }));
    const dataSource = new HttpDataSource("http://localhost:8000", fetcher);

    await expect(dataSource.getStock("999999")).resolves.toBeNull();
    await expect(dataSource.getModel("up")).resolves.toBeNull();
  });

  it("fails closed for non-detail HTTP errors", async () => {
    const fetcher = vi.fn(async () =>
      new Response("backend unavailable", { status: 503 }),
    );
    const dataSource = new HttpDataSource("http://localhost:8000", fetcher);

    await expect(dataSource.getStocks()).rejects.toMatchObject({
      name: "HttpDataSourceError",
      status: 503,
      responseBody: "backend unavailable",
    } satisfies Partial<HttpDataSourceError>);
  });

  it("fails closed when the response body is not valid JSON", async () => {
    const fetcher = vi.fn(async () =>
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const dataSource = new HttpDataSource("http://localhost:8000", fetcher);

    await expect(dataSource.getEvidenceLayers()).rejects.toMatchObject({
      name: "HttpDataSourceError",
      status: 200,
    } satisfies Partial<HttpDataSourceError>);
  });

  it("wraps network failures with the request URL", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("connection refused");
    });
    const dataSource = new HttpDataSource("http://localhost:8000", fetcher);

    await expect(dataSource.getBaselineBacktest()).rejects.toMatchObject({
      name: "HttpDataSourceError",
      status: 0,
      url: "http://localhost:8000/api/v1/backtests/baseline",
    } satisfies Partial<HttpDataSourceError>);
  });
});
