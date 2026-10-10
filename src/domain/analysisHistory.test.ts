import { describe, expect, it } from "vitest";
import { summarizeAnalysisHistory } from "./analysisHistory";
import { demoScreener } from "../data/ScreenerDataSource";

describe("daily analysis history", () => {
  it("leaves genuinely unobserved days absent", () => {
    const results = summarizeAnalysisHistory(demoScreener.entries);
    expect(results.map(item => item.date)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
    expect(results.every(item => item.records === 1)).toBe(true);
  });
  it("counts distinct securities separately from models", () => {
    const item = demoScreener.entries[0];
    const summary = summarizeAnalysisHistory([...demoScreener.entries, { ...item, analysisId: "alternate", validation: "verified" }]);
    const date = summary.find(x => x.date === "2026-10-01");
    expect(date).toMatchObject({records: 2, securities: 1, up: 2, pending: 1, verified: 1});
  });
  it("returns empty results rather than invented zero days", () => {
    expect(summarizeAnalysisHistory([])).toEqual([]);
  });
});
