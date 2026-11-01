import {describe,it,expect} from "vitest";
import {summarizeCollectionPreview} from "./collectionPreviewSummary";
import type {OperationalCatalog} from "@/data/OperationalMarketDataSource";
const base:OperationalCatalog={schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",total:3,offset:0,limit:25,items:[{ticker:"000020",latestDataDate:"2026-10-27"},{ticker:"005930",latestDataDate:"2026-10-30"},{ticker:"000030",latestDataDate:"2026-10-30"}]};
describe("collection preview summary",()=>{
 it("computes observed date range and counts from returned rows",()=>{
  expect(summarizeCollectionPreview(base)).toEqual({observedCount:3,previewCount:3,newestDate:"2026-10-30",oldestDate:"2026-10-27",matchingNewest:2,distinctDates:2,isPartial:false});
 });
 it("marks limited catalog pages as partial and does not imply full universe coverage",()=>{
  expect(summarizeCollectionPreview({...base,total:940}).isPartial).toBe(true);
  expect(summarizeCollectionPreview({...base,total:940}).previewCount).toBe(3);
 });
 it("does not invent dates when the API returned no items",()=>{
  expect(summarizeCollectionPreview({...base,total:0,items:[]}).newestDate).toBeNull();
  expect(summarizeCollectionPreview({...base,total:0,items:[]}).matchingNewest).toBe(0);
 });
});
