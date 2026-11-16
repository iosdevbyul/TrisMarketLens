import { describe, expect, it } from "vitest";
import type { DailyResearchResult } from "../data/DailyResearchDataSource";
import { researchSourceRows, type ResearchStatusInput } from "./researchSourceStatus";

function input(overrides: Partial<ResearchStatusInput> = {}): ResearchStatusInput {
  return {
    sourceMode: "http",
    health: { status: "ok", service: "DonghakStockVision", mode: "read_only" },
    management: { state: "available", models: [{ key: "gemma4" }], comparisons: [{ comparisonContractId: "c1" }], partialErrors: [] },
    ticker: "005930",
    daily: {
      source: "http", error: null, unavailable: false,
      data: { ticker: "005930", totalRecords: 3, records: [{ jobReference: "j1" }] } as NonNullable<DailyResearchResult["data"]>,
    },
    ...overrides,
  };
}

describe("integrated research source states", () => {
  it("reports independent verified publications without equating them to approval", () => {
    expect(researchSourceRows(input()).map((row) => row.status)).toEqual([
      "available", "available", "available", "available",
    ]);
    expect(researchSourceRows(input())[3].count).toBe(3);
  });
  it("keeps management comparisons unavailable when their optional endpoint fails", () => {
    const rows = researchSourceRows(input({
      management: { state: "available", models: [{ key: "gemma4" }], comparisons: [], partialErrors: ["Research comparisons are currently unavailable."] },
    }));
    expect(rows[1].status).toBe("available");
    expect(rows[2].status).toBe("unavailable");
    expect(rows[2].count).toBeNull();
  });
  it("does not convert demo or disconnected daily data into live evidence", () => {
    const rows = researchSourceRows(input({
      sourceMode: "mock", health: null, ticker: null, daily: null,
      management: { state: "unconfigured", models: [], comparisons: [], partialErrors: [] },
    }));
    expect(rows.map((row) => row.status)).toEqual(["demo", "disconnected", "disconnected", "not_checked"]);
  });
  it("distinguishes empty valid publication from failure and no ticker selection", () => {
    const empty = researchSourceRows(input({ daily: {
      source: "http", error: null, unavailable: false,
      data: { ticker: "005930", totalRecords: 0, records: [] } as NonNullable<DailyResearchResult["data"]>,
    } }));
    expect(empty[3]).toMatchObject({ status: "empty", count: 0 });
    const failed = researchSourceRows(input({ daily: { source: "http", data: null, error: "HTTP 503", unavailable: true } }));
    expect(failed[3]).toMatchObject({ status: "unavailable", count: null });
  });
});
