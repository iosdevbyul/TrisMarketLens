import { describe, expect, it, vi } from "vitest";
import { demonstrationOperations, loadOperations } from "./OperationsDataSource";
describe("OperationsDataSource", () => {
  it("defaults to an honest disconnected snapshot", async () => {
    const result = await loadOperations();
    expect(result.snapshot.runs).toEqual([]);
    expect(result.snapshot.latestDataThrough).toBeNull();
    expect(result.source).toBe("disconnected");
  });
  it("exposes clearly labeled demonstration runs", async () => {
    const result = await loadOperations({ mode: "mock" });
    expect(result.source).toBe("mock");
    expect(result.snapshot).toEqual(demonstrationOperations);
  });
  it("fetches the read-only endpoint without caching", async () => {
    const fetcher = vi.fn(async () => Response.json(demonstrationOperations));
    const result = await loadOperations({ mode: "http", apiBaseUrl: "http://localhost:8000/", fetcher: fetcher as typeof fetch });
    expect(result.error).toBeNull();
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations", expect.objectContaining({ cache: "no-store", headers: { Accept: "application/json" } }));
  });
  it("fails closed for unavailable endpoint", async () => {
    const result = await loadOperations({ mode: "http", apiBaseUrl: "http://localhost:8000", fetcher: (async () => new Response(null, { status: 404 })) as typeof fetch });
    expect(result.snapshot.connection).toBe("degraded");
    expect(result.snapshot.runs).toEqual([]);
    expect(result.error).toContain("404");
  });
  it("rejects malformed and duplicate run records", async () => {
    const invalid = { ...demonstrationOperations, runs: [demonstrationOperations.runs[0], demonstrationOperations.runs[0]] };
    const result = await loadOperations({ mode: "http", apiBaseUrl: "http://localhost:8000", fetcher: (async () => Response.json(invalid)) as typeof fetch });
    expect(result.error).toContain("invalid");
    expect(result.snapshot.runs).toEqual([]);
  });
});
