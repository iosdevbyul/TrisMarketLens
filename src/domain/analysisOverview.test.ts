import { describe, expect, it } from "vitest";
import { summarizeAnalyses } from "./analysisOverview";
import { demoScreener } from "../data/ScreenerDataSource";

describe("analysis dashboard summary", () => {
  it("does not invent dates, percentages, or runs for empty data", () => {
    expect(summarizeAnalyses([])).toEqual({
      analysisCount:0,securityCount:0,direction:{up:0,down:0,neutral:0},
      validation:{verified:0,pending:0,blocked:0},latestDataThrough:null,
      latestAnalyzedAt:null,verifiedRate:null,
    });
  });
  it("counts analyses independently of unique securities", () => {
    const a=demoScreener.entries[0];
    const overview=summarizeAnalyses([...demoScreener.entries,{...a,analysisId:"another"}]);
    expect(overview.analysisCount).toBe(4);
    expect(overview.securityCount).toBe(3);
    expect(overview.direction.up).toBe(2);
    expect(overview.latestDataThrough).toBe("2026-10-01");
    expect(overview.verifiedRate).toBe(0);
  });
  it("does not modify source entries", () => {
    const entries=[...demoScreener.entries];summarizeAnalyses(entries);
    expect(entries).toEqual(demoScreener.entries);
  });
});
