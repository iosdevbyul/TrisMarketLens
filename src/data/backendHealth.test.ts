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
      detail: "DONGHAK_API_BASE_URL must be a local loopback HTTP endpoint in HTTP mode.",
    });
  });

  it("rejects remote or credentialed URL without making a health request", async () => {
    const fetcher = vi.fn();
    for(const url of ["https://remote.example:443","http://localhost.evil.example:8000","http://user:pass@localhost:8000","http://localhost:8000/secret"]) {
      const result = await checkBackendHealth(url, fetcher);
      expect(result.status).toBe("misconfigured");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a different read-only service identity", async () => {
    const result = await checkBackendHealth("http://localhost:8000", async () => Response.json({
      status:"ok",service:"ImpersonatingService",mode:"read_only"
    }));
    expect(result.status).toBe("unreachable");
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
      detail: "DonghakStockVision health request failed or timed out.",
    });
  });
});
