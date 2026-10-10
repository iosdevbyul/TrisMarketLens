import {describe,it,expect} from "vitest";
import {isOhlcvSeries} from "./ohlcv";
const base={ticker:"005930",bars:[{date:"2025-06-30",open:100,high:110,low:90,close:105,volume:7}]};
describe("original KRX OHLCV values",()=>{
 it("accepts true no-trade bars without replacing recorded zeros",()=>{
  const data={ticker:"005930",bars:[{date:"2025-06-30",open:0,high:0,low:0,close:105,volume:0}]};
  expect(isOhlcvSeries(data,"005930")).toBe(true);
  expect(data.bars[0].open).toBe(0);
 });
 it("rejects partial zero OHLC with trades",()=>{
  expect(isOhlcvSeries({ticker:"005930",bars:[{date:"2025-06-30",open:0,high:0,low:0,close:105,volume:7}]},"005930")).toBe(false);
 });
 it("accepts normal valid candle series",()=>expect(isOhlcvSeries(base,"005930")).toBe(true));
});
