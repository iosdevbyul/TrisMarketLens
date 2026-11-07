import {describe,expect,it} from "vitest";
import {filterScreener,isScreenerSnapshot,type ScreenerEntry} from "./screener";
import {publicationCrossCheck} from "./researchWorkbench";
import {chartAnalysesForSource} from "./marketChartProvenance";
import {buildResearchPath,type JourneyInputs} from "./researchPath";
import {historicalCatalogHref,historicalCompareHref,parseHistoricalSelection} from "./historicalPortfolioSelection";
import {operationalOhlcvCsv} from "./operationalOhlcvCsv";
import {normalizeLocalBackendUrl} from "../data/localBackendUrl";

const up:ScreenerEntry={ticker:"005930",name:"Test",analysisId:"a",modelId:"m",modelVersion:"1",direction:"up",score:0.6,
 validation:"verified",dataThrough:"2026-11-07",analyzedAt:"2026-11-07T20:00:00+09:00"};
const later:ScreenerEntry={...up,ticker:"000660",analysisId:"b",analyzedAt:"2026-11-07T12:30:00Z"};
const filters={query:"",direction:"all",validation:"all",sort:"date" as const};
describe("P5 release cross-feature regression gates",()=>{
 it("orders newest published screener records by absolute instant rather than timezone string",()=>{
  expect(filterScreener([up,later],filters).map(x=>x.ticker)).toEqual(["000660","005930"]);
  expect(filterScreener([up,later],{...filters,query:"005930"}).map(x=>x.ticker)).toEqual(["005930"]);
  expect(filterScreener([up,later],{...filters,validation:"blocked"})).toEqual([]);
 });
 it("rejects malformed screener ticker and impossible Gregorian observation date",()=>{
  expect(isScreenerSnapshot({entries:[up]})).toBe(true);
  expect(isScreenerSnapshot({entries:[{...up,ticker:"../../"}]})).toBe(false);
  expect(isScreenerSnapshot({entries:[{...up,dataThrough:"2026-02-30"}]})).toBe(false);
 });
 it("never upgrades mock or broken HTTP analysis into verified cross-source research evidence",()=>{
  const screener={source:"http" as const,error:null,entries:[up]};
  const analysis={source:"http" as const,error:null,records:[{
   id:"a",ticker:"005930",analyzedAt:up.analyzedAt,dataThrough:up.dataThrough,
   modelId:"m",modelVersion:"1",direction:"up" as const,score:0.6,validation:"verified" as const,explanation:null
  }]};
  expect(publicationCrossCheck("005930",screener,analysis).state).toBe("corroborated");
  expect(publicationCrossCheck("005930",{...screener,source:"mock"},analysis).state).toBe("source_mismatch");
  expect(publicationCrossCheck("005930",screener,{...analysis,error:"HTTP 503"}).state).toBe("unavailable");
  expect(chartAnalysesForSource("http","mock",null)).toBe(false);
 });
 it("keeps URL-only portfolio comparisons bounded and cannot infer trade permissions",()=>{
  const first="a".repeat(64),second="b".repeat(64);
  const chosen=[first,second];
  const catalog=historicalCatalogHref(10,chosen);
  const compare=historicalCompareHref(chosen);
  expect(parseHistoricalSelection(new URL(catalog,"http://localhost").searchParams.getAll("id"))).toEqual(chosen);
  expect(compare).toContain("/backtesting/portfolios/compare");
  expect(historicalCompareHref([first,first])).toBeNull();
  expect(historicalCompareHref([first])).toBeNull();
 });
 it("treats unavailable published sources as blocked/unavailable, not a successful workflow",()=>{
  const input:JourneyInputs={mode:"http",ticker:"005930",source:{
   operational:{count:1,error:null},
   stocks:{count:1,includesTicker:true,error:null},
   models:{count:2,error:null},
   analysis:{count:0,error:"HTTP 503",source:"http"},
   evidence:{count:1,unresolvedSecurities:1,error:null},
   portfolios:{count:null,error:"not configured"},
   operations:{count:0,error:null,source:"http"}
  }};
  const stages=buildResearchPath(input);
  expect(stages.find(s=>s.id==="analysis")?.status).toBe("unavailable");
  expect(stages.find(s=>s.id==="validation")?.status).toBe("blocked");
  expect(stages.find(s=>s.id==="portfolio")?.status).toBe("unavailable");
  expect(buildResearchPath({...input,mode:"mock"}).every(s=>s.status==="demo")).toBe(true);
 });
 it("protects CSV original price values and rejects non-loopback backend configuration",()=>{
  const csv=operationalOhlcvCsv("005930",[{date:"2026-11-07",open:100,high:110,low:90,close:105,volume:1}]);
  expect(csv).toContain("2026-11-07");
  expect(csv).toContain("105");
  expect(normalizeLocalBackendUrl("http://localhost:8000")).toBe("http://localhost:8000");
  expect(normalizeLocalBackendUrl("https://remote.example")).toBeNull();
 });
});
