import { describe, expect, it } from "vitest";
import {
  isAutonomousResearchPublication, researchStudySummary,
  type AutonomousResearchPublication, type ResearchResultView, type ResearchRunView,
} from "./autonomousResearchPublication";

const result: ResearchResultView = {
  meanAp: 0.63, stabilityAp: 0.57, worstBalancedAccuracy: 0.51,
  largestTrainGap: 0, pitQualified: false, performanceApproved: false,
  executionAuthorized: false, hasDeferredDiagnostic: true,
  hasRobustSummary: true, hasGeneralizationTraining: false,
};
const run: ResearchRunView = {
  state: "completed", agent: "gemma", recordedAt: null, attempts: 1,
  completed: 1, failed: 0, remaining: 0, trainedThisRun: 1,
  cacheHits: 0, llmAccepted: 1, llmRejected: 0,
  gemmaAccepted: 1, gemmaRejected: 0, pitQualified: false,
  performanceApproved: false, executionAuthorized: false,
  independentFuturePerformanceEstablished: false,
};
const fixture: AutonomousResearchPublication = {
  schemaVersion: "autonomous_research_local_publication_v1",
  scope: "operator_local_redacted_snapshot_not_a_live_api",
  generatedAt: "2026-11-17T00:00:00+00:00",
  studyCount: 1, skippedStudyCount: 0, containsPartialStudies: false,
  aggregateCounts: {
    autonomous_run: 1, autonomous_result: 1,
    autonomous_selection: 0, autonomous_terminal: 0,
  },
  studies: [{
    study: "case-1", truncated: false,
    kinds: {autonomous_run:1,autonomous_result:1,autonomous_selection:0,autonomous_terminal:0},
    runs: [run],results: [result],selections: [],terminals: [],
  }],
};
describe("local autonomous research publication",()=>{
  it("validates actual bounded exported summary without predicting future performance",()=>{
    expect(isAutonomousResearchPublication(fixture)).toBe(true);
    expect(researchStudySummary(fixture.studies[0])).toMatchObject({
      meanApObserved:1,meanApMin:0.63,meanApMax:0.63,
      completedRuns:1,blockedOrFailed:0,
      independentPerformanceEstablished:false,anyApproved:false,
    });
  });
  it("rejects aggregates that do not equal the sum of included studies",()=>{
    expect(isAutonomousResearchPublication({
      ...fixture,aggregateCounts:{...fixture.aggregateCounts,autonomous_result:99},
    })).toBe(false);
  });
  it("rejects structural omissions, oversized scores and invalid diagnostic flags",()=>{
    expect(isAutonomousResearchPublication({
      ...fixture,studies:[{...fixture.studies[0],results:[{...result,meanAp:2}]}],
    })).toBe(false);
    expect(isAutonomousResearchPublication({
      ...fixture,studies:[{...fixture.studies[0],results:[{...result,hasRobustSummary:"yes"}]}],
    })).toBe(false);
    expect(isAutonomousResearchPublication({
      ...fixture,studies:[{...fixture.studies[0],runs:[{...run,performanceApproved:"unknown"}]}],
    })).toBe(false);
  });
  it("rejects injected directory identities and duplicate studies",()=>{
    expect(isAutonomousResearchPublication({
      ...fixture,studies:[{...fixture.studies[0],study:"../private"}],
    })).toBe(false);
    expect(isAutonomousResearchPublication({
      ...fixture,studyCount:2,studies:[fixture.studies[0],fixture.studies[0]],
      aggregateCounts:{...fixture.aggregateCounts,autonomous_run:2,autonomous_result:2},
    })).toBe(false);
  });
  it("marks partial data explicitly and preserves null metrics",()=>{
    const partial = {
      ...fixture,containsPartialStudies:true,skippedStudyCount:1,
      studies:[{...fixture.studies[0],results:[{...result,meanAp:null}]}],
    };
    expect(isAutonomousResearchPublication(partial)).toBe(true);
    expect(researchStudySummary(partial.studies[0]).meanApObserved).toBe(0);
    expect(researchStudySummary(partial.studies[0]).meanApMin).toBeNull();
  });
});
