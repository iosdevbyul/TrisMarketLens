import {describe,expect,it} from "vitest";
import {
 addHistoricalSelection,historicalCatalogHref,historicalCompareHref,
 parseHistoricalSelection,removeHistoricalSelection
} from "./historicalPortfolioSelection";

const a="a".repeat(64),b="b".repeat(64),c="c".repeat(64),d="d".repeat(64),e="e".repeat(64),f="f".repeat(64);
describe("URL-backed historical portfolio selection across pages",()=>{
 it("parses valid repeated report IDs in their selected order",()=>{
  expect(parseHistoricalSelection([a,b,c])).toEqual([a,b,c]);
  expect(parseHistoricalSelection(a)).toEqual([a]);
  expect(parseHistoricalSelection(undefined)).toEqual([]);
 });
 it("fails closed for invalid identifiers, duplicates or more than five entries",()=>{
  for(const invalid of [[a,a],[a,"../../escape"],[a,b,c,d,e,f],["not-a-hash"],[a,12],[]]){
   expect(parseHistoricalSelection(invalid)).toEqual([]);
  }
 });
 it("adds candidates from different catalog pages while preserving order",()=>{
  const one=addHistoricalSelection([],a);
  const two=addHistoricalSelection(one,b);
  expect(two).toEqual([a,b]);
  const third=addHistoricalSelection(two,c);
  expect(third).toEqual([a,b,c]);
  expect(addHistoricalSelection(third,a)).toEqual(third);
  expect(two).toEqual([a,b]);
 });
 it("enforces maximum 5 selections and ignores invalid additions",()=>{
  const full=[a,b,c,d,e];
  expect(addHistoricalSelection(full,f)).toEqual(full);
  expect(addHistoricalSelection([a],"invalid")).toEqual([a]);
  expect(removeHistoricalSelection([a,b,c],b)).toEqual([a,c]);
 });
 it("retains all selected IDs when moving forwards and backwards in the archive",()=>{
  const href=historicalCatalogHref(20,[a,b]);
  const url=new URL(href,"http://localhost");
  expect(url.pathname).toBe("/backtesting/portfolios");
  expect(url.searchParams.get("offset")).toBe("20");
  expect(url.searchParams.getAll("id")).toEqual([a,b]);
  expect(historicalCatalogHref(0,[a,b])).not.toContain("offset=");
  expect(historicalCatalogHref(0,[])).toBe("/backtesting/portfolios");
 });
 it("builds a comparison URL only for 2-5 unique valid IDs",()=>{
  const url=historicalCompareHref([a,b,c]);
  expect(url).not.toBeNull();
  const parsed=new URL(url!,"http://localhost");
  expect(parsed.pathname).toBe("/backtesting/portfolios/compare");
  expect(parsed.searchParams.getAll("id")).toEqual([a,b,c]);
  expect(historicalCompareHref([a])).toBeNull();
  expect(historicalCompareHref([a,a])).toBeNull();
  expect(historicalCompareHref([a,b,c,d,e,f])).toBeNull();
 });
});
