import { describe, expect, it } from "vitest";
import { classifyResearchComparisons } from "./aiResearchComparisonGroups";

describe("managed LLM comparison contract isolation", () => {
  it("groups only exact backend contract identities", () => {
    const classified = classifyResearchComparisons([
      { comparisonContractId: "contract-a", modelKey: "gemma4", runId: "r1" },
      { comparisonContractId: "contract-a", modelKey: "gemma2", runId: "r2" },
      { comparisonContractId: "contract-b", modelKey: "gemma4", runId: "r3" },
      { modelKey: "unidentified", runId: "r4" },
      { comparisonContractId: "", modelKey: "unidentified", runId: "r5" },
    ]);
    expect(classified.total).toBe(5);
    expect(classified.comparable).toHaveLength(2);
    expect(classified.comparable[0]).toMatchObject({
      contractId: "contract-a",
      modelKeys: ["gemma2", "gemma4"],
      runCount: 2,
      comparablePairCount: 1,
    });
    expect(classified.comparable[1]).toMatchObject({
      contractId: "contract-b",
      runCount: 1,
      comparablePairCount: 0,
    });
    expect(classified.unclassified).toHaveLength(2);
  });
  it("does not infer comparability from labels or research scores", () => {
    const result = classifyResearchComparisons([
      { modelKey: "m1", score: 0.6 },
      { modelKey: "m1", score: 0.7 },
    ]);
    expect(result.comparable).toEqual([]);
    expect(result.unclassified).toHaveLength(2);
  });
  it("does not merge partially matching or oversized fingerprint identities", () => {
    const result = classifyResearchComparisons([
      { comparisonContractId: "plan-1", modelKey: "m" },
      { comparisonContractId: "plan-10", modelKey: "m" },
      { comparisonContractId: "a".repeat(257), modelKey: "m" },
    ]);
    expect(result.comparable.map((group) => group.contractId)).toEqual(["plan-1", "plan-10"]);
    expect(result.unclassified).toHaveLength(1);
  });
});
