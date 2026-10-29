import {describe,expect,it} from "vitest";
import {normalizeOperationalTicker} from "./OperationalTickerSearch";
describe("direct operational ticker lookup",()=>{
 it("preserves six-digit KRX codes",()=>expect(normalizeOperationalTicker("005930")).toBe("005930"));
 it("normalizes supported alphanumeric codes",()=>expect(normalizeOperationalTicker(" a12345 ")).toBe("A12345"));
 it("rejects malformed or unsafe paths",()=>{
  for(const value of ["", "12345", "../foo", "005930/other", "가나다123", "0000000"]){
   expect(normalizeOperationalTicker(value)).toBeNull();
  }
 });
});
