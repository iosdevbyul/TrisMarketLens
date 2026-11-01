import {describe,it,expect} from "vitest";
import {summarizeObservationCoverage} from "./observationCoverage";
import type {OhlcvBar} from "./ohlcv";
const bar=(date:string,noTrade=false):OhlcvBar=>({date,open:noTrade?0:100,high:noTrade?0:110,low:noTrade?0:90,close:100,volume:noTrade?0:100});
describe("observed coverage",()=>{
 it("does not infer unrecorded trading sessions",()=>{
  expect(summarizeObservationCoverage([bar("2026-10-26"),bar("2026-10-30",true)])).toEqual({firstDate:"2026-10-26",lastDate:"2026-10-30",observedDates:2,calendarDays:5,noTradeDates:1});
 });
 it("handles single and empty snapshots",()=>{
  expect(summarizeObservationCoverage([])).toBeNull();
  expect(summarizeObservationCoverage([bar("2026-10-26")])?.calendarDays).toBe(1);
 });
});
