import { describe, expect, it } from "vitest";
import type { DailyResearchRecord } from "./dailyResearch";
import { summarizeDailyResearchPage } from "./dailyResearchPageSummary";

function item(overrides: Partial<DailyResearchRecord>): DailyResearchRecord {
  return {
    tradingDate: "2026-11-13",
    jobReference: "job-1",
    status: "completed",
    modelId: "m1",
    modelVersion: "v1",
    dataOrigin: "real",
    researchScore: 0.51,
    researchSignal: "up",
    ...overrides,
  } as DailyResearchRecord;
}
describe("daily research page-only evidence summary", () => {
  it("counts only supplied records and preserves origin and status distinctions", () => {
    const summary = summarizeDailyResearchPage([
      item({}),
      item({ tradingDate: "2026-11-12", jobReference: "job-2", status: "failed", dataOrigin: "synthetic_fixture", researchScore: null, researchSignal: "unavailable" }),
      item({ jobReference: "job-3", researchSignal: "down", modelVersion: "v2", researchScore: 0.7 }),
      item({ jobReference: "job-4", status: "pending", researchScore: null, researchSignal: "unavailable" }),
    ]);
    expect(summary).toMatchObject({
      displayed: 4, completed: 2, failed: 1, pending: 1,
      real: 3, synthetic: 1, withScore: 2, distinctModels: 2,
      directionUp: 1, directionDown: 1, directionNeutral: 0,
      observedDates: [
        { date: "2026-11-12", completed: 0, unresolved: 1 },
        { date: "2026-11-13", completed: 2, unresolved: 1 },
      ],
    });
  });
  it("never manufactures an observation from an empty page", () => {
    expect(summarizeDailyResearchPage([])).toMatchObject({
      displayed: 0, completed: 0, withScore: 0, distinctModels: 0, observedDates: [],
    });
  });
});
