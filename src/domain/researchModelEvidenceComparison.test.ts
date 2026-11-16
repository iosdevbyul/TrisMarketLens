import { describe, expect, it } from "vitest";
import type { DailyResearchRecord } from "./dailyResearch";
import { compareVisibleResearchModels } from "./researchModelEvidenceComparison";

function sample(overrides: Partial<DailyResearchRecord> = {}): DailyResearchRecord {
  return {
    modelId: "direction-v2", modelVersion: "v1", dataOrigin: "real", tradingDate: "2026-11-13",
    jobReference: "job1", status: "completed", researchScore: 0.65, researchSignal: "up",
    ...overrides,
  } as DailyResearchRecord;
}

describe("research model evidence comparison", () => {
  it("keeps model versions and real/synthetic evidence in separate groups", () => {
    const rows = compareVisibleResearchModels([
      sample(),
      sample({ jobReference: "job2", status: "pending", researchScore: null, researchSignal: "unavailable", tradingDate: "2026-11-12" }),
      sample({ jobReference: "job3", modelVersion: "v2", researchSignal: "down" }),
      sample({ jobReference: "fixture1", dataOrigin: "synthetic_fixture", researchSignal: "neutral" }),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.modelVersion === "v1" && row.origin === "real")).toMatchObject({
      count: 2, completed: 1, pending: 1, scoreRecorded: 1, distinctJobReferences: 2,
      firstTradingDate: "2026-11-12", lastTradingDate: "2026-11-13", directions: { up: 1, down: 0, neutral: 0 },
    });
    expect(rows.find((row) => row.modelVersion === "v2")).toMatchObject({ count: 1, completed: 1, directions: { up: 0, down: 1, neutral: 0 } });
    expect(rows.find((row) => row.origin === "synthetic_fixture")).toMatchObject({ count: 1, directions: { up: 0, down: 0, neutral: 1 } });
  });
  it("does not invent any missing research records", () => {
    expect(compareVisibleResearchModels([])).toEqual([]);
    expect(compareVisibleResearchModels([
      sample({ status: "failed", researchScore: null, researchSignal: "unavailable" }),
    ])).toMatchObject([{ completed: 0, failed: 1, scoreRecorded: 0, directions: { up: 0, down: 0, neutral: 0 } }]);
  });
});
