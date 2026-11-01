import {describe,it,expect} from "vitest";
import {groupObservationMonths} from "./observationTimeline";
import type {OhlcvBar} from "./ohlcv";
const bar=(date:string,nt=false):OhlcvBar=>({date,open:nt?0:100,high:nt?0:110,low:nt?0:90,close:100,volume:nt?0:100});
describe("observation timeline",()=>{
 it("counts observed records per month without filling calendar gaps",()=>{
  expect(groupObservationMonths([bar("2026-08-31"),bar("2026-10-26"),bar("2026-10-30",true)])).toEqual([
   {month:"2026-08",observed:1,noTrade:0,firstDate:"2026-08-31",lastDate:"2026-08-31"},
   {month:"2026-10",observed:2,noTrade:1,firstDate:"2026-10-26",lastDate:"2026-10-30"}
  ]);
 });
 it("returns empty timeline with no observations",()=>expect(groupObservationMonths([])).toEqual([]));
});
