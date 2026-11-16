import { describe, expect, it } from "vitest";
import { metricDistribution, summarizeStudyEvidence } from "./autonomousResearchInsights";
import type { ResearchResultView, ResearchStudyView } from "./autonomousResearchPublication";

const base: ResearchResultView = {
  meanAp: null,stabilityAp:null,worstBalancedAccuracy:null,largestTrainGap:null,
  pitQualified:false,performanceApproved:false,executionAuthorized:false,
  hasDeferredDiagnostic:false,hasRobustSummary:false,hasGeneralizationTraining:false,
};
function study(results: ResearchResultView[]): ResearchStudyView {
  return {
    study:"same-study",truncated:false,
    kinds:{autonomous_run:0,autonomous_result:results.length,autonomous_selection:0,autonomous_terminal:0},
    runs:[],results,selections:[],terminals:[],
  };
}
describe("autonomous research insights",()=>{
  it("calculates deterministic percentiles and mutually exclusive histogram counts",()=>{
    const rows = [0,0.2,0.5,0.8,1,null].map(meanAp=>({...base,meanAp}));
    const summary = metricDistribution(rows,"meanAp");
    expect(summary.observed).toBe(5);
    expect(summary.missing).toBe(1);
    expect([summary.minimum,summary.q1,summary.median,summary.q3,summary.maximum]).toEqual([0,0.2,0.5,0.8,1]);
    expect(summary.buckets.map(bucket=>bucket.count)).toEqual([1,1,1,1,1]);
    expect(summary.buckets.reduce((sum,bucket)=>sum+bucket.count,0)).toBe(summary.observed);
  });
  it("preserves absence of metrics and does not invent a statistic",()=>{
    expect(metricDistribution([{...base}],"stabilityAp")).toMatchObject({
      observed:0,missing:1,minimum:null,q1:null,median:null,q3:null,maximum:null,
    });
    expect(metricDistribution([{...base,meanAp:0.7}],"meanAp")).toMatchObject({
      observed:1,minimum:0.7,q1:0.7,median:0.7,q3:0.7,maximum:0.7,
    });
  });
  it("does not equate diagnostic presence with review approval",()=>{
    const rows=[
      {...base,meanAp:0.6,hasDeferredDiagnostic:true,hasRobustSummary:true,
       hasGeneralizationTraining:true,performanceApproved:false},
      {...base,meanAp:0.8,performanceApproved:null,pitQualified:null},
    ];
    const summary=summarizeStudyEvidence(study(rows));
    expect(summary).toMatchObject({
      results:2,approved:0,pitQualified:0,executionAuthorized:0,
      approvalUnknown:1,pitUnknown:1,
      diagnosticPresence:{deferred:1,robustness:1,generalization:1},
      complete:true,
    });
  });
  it("reports independent terminal/run states without falsely joining records",()=>{
    const current=study([{...base}]);
    current.runs=[{state:"completed"} as ResearchStudyView["runs"][number],
                  {state:"failed"} as ResearchStudyView["runs"][number]];
    current.terminals=[{state:"failed"} as ResearchStudyView["terminals"][number]];
    current.kinds.autonomous_run=2;
    current.kinds.autonomous_terminal=1;
    expect(summarizeStudyEvidence(current)).toMatchObject({
      runStates:[{state:"completed",count:1},{state:"failed",count:1}],
      terminalStates:[{state:"failed",count:1}],
      complete:true,
    });
    current.truncated=true;
    expect(summarizeStudyEvidence(current).complete).toBe(false);
  });
});
