import {describe,expect,it} from "vitest";
import {evidenceForTicker,publishedModelStatus,researchState,selectedResearchModel,validResearchTicker} from "./researchWorkbench";
import type {ScreenerEntry} from "./screener";
import type {StockAnalysisRecord} from "./stockAnalysis";
import type {ModelSummary} from "./research";

const entry:ScreenerEntry={ticker:"005930",name:"Example",analysisId:"source-1",modelId:"published-model",
 modelVersion:"v1",direction:"up",score:0.73,validation:"verified",dataThrough:"2026-10-30",analyzedAt:"2026-11-02T18:00:00Z"};
const record:StockAnalysisRecord={id:entry.analysisId,ticker:entry.ticker,analyzedAt:entry.analyzedAt,
 dataThrough:entry.dataThrough,modelId:entry.modelId,modelVersion:entry.modelVersion,direction:entry.direction,
 score:entry.score,validation:entry.validation,explanation:"Recorded research, not an instruction"};
describe("Research evidence workbench",()=>{
 it("distinguishes demo, unconfigured, errors and valid empty publications",()=>{
  expect(researchState("mock",null,1)).toBe("demo");
  expect(researchState("disconnected",null,0)).toBe("unconfigured");
  expect(researchState("http","HTTP 503",0)).toBe("error");
  expect(researchState("http",null,0)).toBe("empty");
  expect(researchState("http",null,3)).toBe("available");
 });
 it("accepts only global up/down directions and strict six-character ticker IDs",()=>{
  expect(selectedResearchModel("up")).toBe("up");
  expect(selectedResearchModel("down")).toBe("down");
  expect(selectedResearchModel("neutral")).toBeNull();
  expect(validResearchTicker("005930")).toBe(true);
  expect(validResearchTicker("001")).toBe(false);
  expect(validResearchTicker("005930/")).toBe(false);
 });
 it("cross-checks exact published record and screener identity without inventing artifact association",()=>{
  const match=evidenceForTicker([entry],"005930",[record]);
  expect(match.matched).toBe(true);
  expect(match.entries).toHaveLength(1);
  expect(match.records).toHaveLength(1);
  const changed={...record,modelId:"different-global-model"};
  expect(evidenceForTicker([entry],"005930",[changed]).matched).toBe(false);
  expect(evidenceForTicker([entry],"000660",[record]).matched).toBe(false);
  expect(evidenceForTicker([entry],"005930",[]).matched).toBe(false);
 });
 it("does not equate global model direction with published ticker modelId",()=>{
  const models:ModelSummary[]=[{id:"up",direction:"Up",modelName:"Global Up",role:"baseline_executable",
   validationAveragePrecision:0.7,oosAveragePrecision:0.65,note:"Frozen global"}];
  expect(publishedModelStatus(models,"up")?.modelName).toBe("Global Up");
  expect(publishedModelStatus(models,"down")).toBeNull();
  const cross=evidenceForTicker([entry],"005930",[{...record,modelId:"Global Up"}]);
  expect(cross.matched).toBe(false);
 });
 it("never shows a screener entry as evidence for a different ticker",()=>{
  expect(evidenceForTicker([entry],"000660",[{...record,ticker:"000660"}]).entries).toEqual([]);
  expect(evidenceForTicker([entry],"../../",[])).toEqual({entries:[],records:[],matched:false});
 });
});
