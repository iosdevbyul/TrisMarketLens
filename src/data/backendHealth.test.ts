import { describe, expect, it, vi } from "vitest";

import { checkBackendHealth } from "./backendHealth";

describe("checkBackendHealth", () => {
  it("reports a healthy read-only DonghakStockVision API", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        status: "ok",
        service: "DonghakStockVision",
        mode: "read_only",
      }),
    );

    await expect(
      checkBackendHealth("http://127.0.0.1:8000/", fetcher),
    ).resolves.toEqual({
      status: "ok",
      service: "DonghakStockVision",
      mode: "read_only",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/health",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("fails closed when the API URL is missing", async () => {
    await expect(checkBackendHealth(undefined)).resolves.toEqual({
      status: "misconfigured",
      detail: "DONGHAK_API_BASE_URL is required in HTTP mode.",
    });
  });

  it("reports an unexpected backend payload", async () => {
    const fetcher = vi.fn(async () => Response.json({ status: "ok" }));

    await expect(
      checkBackendHealth("http://127.0.0.1:8000", fetcher),
    ).resolves.toMatchObject({
      status: "unreachable",
      detail: "DonghakStockVision health returned an unexpected payload.",
    });
  });

  it("reports network failures without falling back to mock data", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("connection refused");
    });

    await expect(
      checkBackendHealth("http://127.0.0.1:8000", fetcher),
    ).resolves.toMatchObject({
      status: "unreachable",
      detail: expect.stringContaining("connection refused"),
    });
  });
});
