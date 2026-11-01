import {describe,it,expect} from "vitest";
import {operationalDateTickersCsv} from "./operationalDateTickersCsv";
describe("operational date CSV",()=>{
 it("preserves tickers and labels unreviewed provenance",()=>{
  expect(operationalDateTickersCsv("2026-10-30",["005930","000020"])).toBe("ticker,latestDataDate,evidenceStatus\r\n005930,2026-10-30,unreviewed\r\n000020,2026-10-30,unreviewed\r\n");
 });
 it("handles no displayed tickers",()=>{
  expect(operationalDateTickersCsv("2026-10-30",[])).toBe("ticker,latestDataDate,evidenceStatus\r\n");
 });
 it("rejects malformed dates and CSV injection tickers",()=>{
  expect(()=>operationalDateTickersCsv("2026-02-30",["005930"])).toThrow();
  expect(()=>operationalDateTickersCsv("2026-10-30",["=IMPORT"])).toThrow();
 });
});
