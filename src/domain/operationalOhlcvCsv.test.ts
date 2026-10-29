import {describe,expect,it} from "vitest";
import {operationalOhlcvCsv} from "./operationalOhlcvCsv";

describe("operational OHLCV CSV export",()=>{
 it("exports only supplied observations preserving leading zeros",()=>{
  expect(operationalOhlcvCsv("005930",[
   {date:"2026-10-28",open:100,high:110,low:90,close:105,volume:7},
   {date:"2026-10-29",open:105,high:115,low:100,close:112,volume:8},
  ])).toBe("date,open,high,low,close,volume\r\n2026-10-28,100,110,90,105,7\r\n2026-10-29,105,115,100,112,8\r\n");
 });
 it("does not invent missing OHLCV rows",()=>{
  expect(operationalOhlcvCsv("005930",[])).toBe("date,open,high,low,close,volume\r\n");
 });
 it("rejects malformed dates and values",()=>{
  expect(()=>operationalOhlcvCsv("BAD/TICKER",[])).toThrow();
  expect(()=>operationalOhlcvCsv("005930",[{date:"2026-10-28",open:NaN,high:3,low:1,close:2,volume:4}])).toThrow();
 });
});
