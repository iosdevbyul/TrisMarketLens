import { describe,expect,it,vi } from "vitest";
vi.mock("server-only",()=>({}));
import {
  labStudies,labExperiments,labExperiment,labMemory,labReports,labReport,labComparisons,
} from "./ResearchLabDataSource";

const id="a".repeat(64), experiment="b".repeat(64), report="c".repeat(64), group="d".repeat(64);
const horizon={horizon:1,experimentCount:1,selectedExperimentId:experiment,selectedMeanAP:0.42,bestSeenAP:0.49,selectedSeenFoldMetrics:[],selectedDeferredDiagnostic:null,selectionUsesDeferredDiagnostic:false};
const study={studyId:id,reportId:report,cohort:"alpha",selectionPolicy:"adaptive",experimentBudget:1,completed:1,failed:0,locked:true,comparisonGroupId:group,horizons:[horizon],researchOnly:true,independentValidationStatus:"NOT_ESTABLISHED",pitQualified:false,performanceApproved:false,executionAuthorized:false};
const record={studyId:id,experimentId:experiment,reportId:report,status:"COMPLETED",horizon:1,modelFamily:"linear",parentExperimentId:null,selectedForHorizon:true,seenFoldMetrics:[{pr_auc_ap:0.42,balanced_accuracy:0.53,brier_score:0.24}],seenFoldBaselines:[],deferredDiagnostic:null,robustSummary:null,comparisonQualification:"DESCRIPTIVE_RESEARCH_ONLY"};
const options=(payload:unknown,status=200)=>({apiBaseUrl:"http://127.0.0.1:8000",fetcher:vi.fn(async()=>new Response(JSON.stringify(payload),{status})) as unknown as typeof fetch});
const paginated=(schemaVersion:string,items:unknown[])=>({schemaVersion,total:items.length,offset:0,limit:25,items});

describe("approved Research Lab API (local-only)",()=>{
  it("loads verified original identifiers and separate selected/best scores",async()=>{
    const opts=options(paginated("research_lab_studies_v1",[study]));
    const r=await labStudies(0,25,opts);
    expect(r.state).toBe("available");
    expect(r.data?.items[0].studyId).toBe(id);
    expect(r.data?.items[0].horizons[0].selectedMeanAP).toBe(0.42);
    expect(r.data?.items[0].horizons[0].bestSeenAP).toBe(0.49);
    expect(opts.fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/research/lab/studies?offset=0&limit=25",
      expect.objectContaining({redirect:"error",cache:"no-store"})
    );
  });
  it("keeps original experiment IDs rather than inferred array positions",async()=>{
    const opts=options(paginated("research_lab_experiments_v1",[record]));
    expect((await labExperiments(id,0,25,opts)).data?.items[0].experimentId).toBe(experiment);
    const details=await labExperiment(id,experiment,options(record));
    expect(details.data?.selectedForHorizon).toBe(true);
    expect(details.data?.seenFoldMetrics[0]?.brier_score).toBe(0.24);
    expect((await labExperiment(id,id,options(record))).state).toBe("invalid");
  });
  it("validates memory links, report scope, and descriptive comparison boundaries",async()=>{
    const memory={schemaVersion:"research_lab_memory_v1",studyId:id,memoryChangedChoices:0,
      interpretation:"HISTORICAL_SEARCH_ONLY_NOT_CAUSAL_LLM_EVIDENCE",
      events:[{experimentId:experiment,parentExperimentId:null,selectionOrder:1,cacheReused:false}]};
    expect((await labMemory(id,options(memory))).data?.events[0].experimentId).toBe(experiment);
    const reportBody={...study,researchPeriod:{first_date:"2024-01-01",last_date:"2024-12-31",dates:100,observations:500},
      sourceClass:"ARCHIVED_KRX_RESEARCH_NOT_INDEPENDENT_PIT",memoryChangedChoices:0,cacheHits:2,learnerSeconds:20,maximumRssKb:100,
      discoveryCurve:[],limitations:["independent_future_performance_not_established"]};
    expect((await labReport(report,options(reportBody))).data?.reportId).toBe(report);
    expect((await labReports(0,25,options(paginated("research_lab_reports_v1",[study])))).state).toBe("available");
    const comparison={schemaVersion:"research_lab_comparisons_v1",items:[{
      comparisonGroupId:group,cohort:"alpha",policies:["adaptive"],
      completeThreeArmComparison:false,policySuperiorityEstablished:false,
      conclusionStatus:"DESCRIPTIVE_ONLY_NOT_INDEPENDENT",horizons:[{horizon:1,arms:[{...horizon,studyId:id,policy:"adaptive"}]}]
    }]};
    expect((await labComparisons(options(comparison))).data?.items[0].policySuperiorityEstablished).toBe(false);
    const forged={...comparison,items:[{...comparison.items[0],policySuperiorityEstablished:true}]};
    expect((await labComparisons(options(forged))).state).toBe("invalid");
  });
  it("blocks remote base URLs without issuing a request",async()=>{
    const fetcher=vi.fn();
    const r=await labStudies(0,25,{apiBaseUrl:"https://public.example.com",fetcher:fetcher as unknown as typeof fetch});
    expect(r.state).toBe("disabled"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("labels missing approved publication and never uses synthetic fallback",async()=>{
    expect((await labStudies(0,25,options({},503))).state).toBe("unavailable");
    expect((await labStudies(0,25,options({},403))).state).toBe("unavailable");
    expect((await labStudies(0,25,options({items:[]},200))).state).toBe("invalid");
    expect((await labExperiments(id,0,25,options(paginated("research_lab_experiments_v1",[{...record,studyId:"f".repeat(64)}])))).state).toBe("invalid");
  });
});
