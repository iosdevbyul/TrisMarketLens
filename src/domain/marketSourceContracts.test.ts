import {describe,expect,it} from "vitest";
import {isSourceCalendarDate} from "./sourceCalendarDate";
import {isStockAnalysisSnapshot} from "./stockAnalysis";
import {isPredictionEvaluationSnapshot} from "./predictionEvaluation";
import {isOhlcvSeries} from "./ohlcv";
const ticker="005930";
const analysis={ticker,records:[{id:"record-1",ticker,analyzedAt:"2026-11-03T08:00:00+09:00",dataThrough:"2026-11-02",modelId:"source-model",modelVersion:"1",direction:"up",score:0.85,validation:"verified",explanation:null}]};
const evaluation={ticker,evaluations:[{id:"result-1",analysisId:"record-1",ticker,evaluatedAt:null,horizonSessions:5,referenceDate:"2026-11-02",referencePrice:101,evaluationDate:null,evaluationPrice:null,realizedReturn:null,verdict:"pending",policyId:"frozen",explanation:null}]};
describe("validated data must use exact Gregorian source dates",()=>{
 it("accepts leap days and rejects normalized impossible calendar dates",()=>{
  expect(isSourceCalendarDate("2024-02-29")).toBe(true);
  for(const day of ["2026-02-29","2026-02-30","2026-04-31","2026-13-01","2026-00-01","2026-01-00","2026-2-1"]){
   expect(isSourceCalendarDate(day)).toBe(false);
  }
 });
 it("rejects invalid published analysis date while preserving its original timezone",()=>{
  expect(isStockAnalysisSnapshot(analysis,ticker)).toBe(true);
  expect(isStockAnalysisSnapshot({ticker,records:[{...analysis.records[0],dataThrough:"2026-02-30"}]},ticker)).toBe(false);
  expect(isStockAnalysisSnapshot({ticker,records:[{...analysis.records[0],score:0.4,validation:"blocked"}]},ticker)).toBe(false);
 });
 it("rejects invalid evaluation days and outcomes preceding their reference dates",()=>{
  expect(isPredictionEvaluationSnapshot(evaluation,ticker)).toBe(true);
  expect(isPredictionEvaluationSnapshot({ticker,evaluations:[{...evaluation.evaluations[0],referenceDate:"2026-02-30"}]},ticker)).toBe(false);
  expect(isPredictionEvaluationSnapshot({ticker,evaluations:[{...evaluation.evaluations[0],evaluationDate:"2026-10-30",verdict:"inconclusive"}]},ticker)).toBe(false);
 });
 it("rejects impossible OHLC dates and unsafe integer prices/volumes",()=>{
  const bar={date:"2026-11-02",open:100,high:110,low:95,close:105,volume:123};
  expect(isOhlcvSeries({ticker,bars:[bar]},ticker)).toBe(true);
  expect(isOhlcvSeries({ticker,bars:[{...bar,date:"2026-02-30"}]},ticker)).toBe(false);
  expect(isOhlcvSeries({ticker,bars:[{...bar,close:Number.MAX_SAFE_INTEGER+1}]},ticker)).toBe(false);
 });
});
