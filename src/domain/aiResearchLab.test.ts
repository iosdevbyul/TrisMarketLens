import { describe, expect, it } from "vitest";
import { labOverview, recordedStatus, resultDetail, searchStudies, summarizeStudy } from "./aiResearchLab";
import type { AutonomousResearchPublication, ResearchStudyView } from "./autonomousResearchPublication";

function makeStudy(study:string):ResearchStudyView{
  return {
    study, truncated:false,
    kinds:{autonomous_run:2,autonomous_result:1,autonomous_selection:1,autonomous_terminal:2},
    runs:[
      {state:"completed",agent:"gemma",recordedAt:"2026-11-15T00:00:00+00:00"},
      {state:"running",agent:"rule",recordedAt:"2026-11-16T00:00:00+00:00"},
    ] as ResearchStudyView["runs"],
    results:[{meanAp:0.62,stabilityAp:null,worstBalancedAccuracy:null,
      pitQualified:false,performanceApproved:false,executionAuthorized:false,
      hasDeferredDiagnostic:true,hasRobustSummary:false,hasGeneralizationTraining:false,
    } as ResearchStudyView["results"][number]],
    selections:[{state:"selected"} as ResearchStudyView["selections"][number]],
    terminals:[{state:"completed"},{state:"failed"}] as ResearchStudyView["terminals"],
  };
}
function publication():AutonomousResearchPublication{
  const one=makeStudy("historical-alpha");
  const two=makeStudy("historical-beta");
  two.truncated=true;
  two.runs=[{...one.runs[0],agent:"python",recordedAt:null}];
  two.kinds.autonomous_run=1;
  return {
    schemaVersion:"autonomous_research_local_publication_v1",
    scope:"operator_local_redacted_snapshot_not_a_live_api",
    generatedAt:"2026-11-17T01:00:00Z",studyCount:2,skippedStudyCount:14,
    containsPartialStudies:true,
    aggregateCounts:{
      autonomous_run:3,autonomous_result:2,autonomous_selection:2,autonomous_terminal:4,
    },
    studies:[one,two],
  };
}
describe("AI Research Lab projectors",()=>{
  it("distinguishes recorded running from actual live execution",()=>{
    const entry=summarizeStudy(makeStudy("study"));
    expect(entry.latestRecordedState).toBe("running");
    expect(entry.lastRecordedAt).toBe("2026-11-16T00:00:00+00:00");
    expect(entry.observedStates).toContain("running");
    expect(entry.completedTerminals).toBe(1);
    expect(entry.failedTerminals).toBe(1);
    expect(recordedStatus("never-seen")).toBe("unreported");
  });
  it("counts only retained artifacts and exposes incomplete scope",()=>{
    const summary=labOverview(publication());
    expect(summary.studiesIncluded).toBe(2);
    expect(summary.omittedDatabases).toBe(14);
    expect(summary.runRecords).toBe(3);
    expect(summary.resultRecords).toBe(2);
    expect(summary.observedTerminalCompleted).toBe(2);
    expect(summary.observedTerminalFailed).toBe(2);
    expect(summary.hasIncompleteEvidence).toBe(true);
    expect(summary.latestRunTime).toBe("2026-11-16T00:00:00+00:00");
  });
  it("filters by real study labels, agent and observed status, never inferred cohort",()=>{
    const data=publication();
    expect(searchStudies(data,{search:"alpha"}).map(item=>item.study)).toEqual(["historical-alpha"]);
    expect(searchStudies(data,{agent:"python"}).map(item=>item.study)).toEqual(["historical-beta"]);
    expect(searchStudies(data,{state:"running"}).map(item=>item.study)).toEqual(["historical-alpha"]);
    expect(searchStudies(data,{state:"paused"})).toEqual([]);
    expect(searchStudies(data,{search:"missing"})).toEqual([]);
  });
  it("uses bounded observation index only, without claiming experiment identity",()=>{
    const study=makeStudy("test");
    expect(resultDetail(study,0)?.meanAp).toBe(0.62);
    expect(resultDetail(study,1)).toBeNull();
    expect(resultDetail(study,-1)).toBeNull();
    expect(resultDetail(study,0.5)).toBeNull();
  });
});
