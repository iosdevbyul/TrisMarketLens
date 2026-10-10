import { describe, expect, it } from "vitest";
import { disconnectedOperations, validateOperationsSnapshot } from "./operations";

describe("operations contract", () => {
  it("never invents runs or freshness when disconnected", () => {
    expect(disconnectedOperations.connection).toBe("not_connected");
    expect(disconnectedOperations.latestDataThrough).toBeNull();
    expect(disconnectedOperations.runs).toEqual([]);
    expect(validateOperationsSnapshot(disconnectedOperations)).toBe(true);
  });
  it("rejects duplicate run identities", () => {
    const run = { id: "run-1", pipeline: "daily-analysis", state: "succeeded" as const, startedAt: null, finishedAt: null, dataThrough: null, summary: null };
    expect(validateOperationsSnapshot({ ...disconnectedOperations, runs: [run, run] })).toBe(false);
  });
  it("rejects invalid states and timestamps", () => {
    expect(validateOperationsSnapshot({ ...disconnectedOperations, runs: [{ id: "x", pipeline: "daily", state: "running", startedAt: "bad", finishedAt: null, dataThrough: null, summary: null }] })).toBe(false);
  });
});
