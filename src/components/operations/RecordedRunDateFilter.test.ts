import {describe,it,expect} from "vitest";
import {filterRunsByStartDate} from "./RecordedRunExplorer";
import type {AnalysisRun} from "@/domain/operations";
const run=(id:string,startedAt:string|null):AnalysisRun=>({id,startedAt,pipeline:"Market collection",state:"unknown",finishedAt:null,dataThrough:null,summary:null});
describe("UTC recorded start date filtering",()=>{
 const rows=[run("a","2026-11-01T23:30:00-05:00"),run("b","2026-11-03T00:00:00Z"),run("c",null)];
 it("preserves all returned records with no date filter",()=>expect(filterRunsByStartDate(rows,"","")).toEqual(rows));
 it("uses UTC day rather than display timezone",()=>expect(filterRunsByStartDate(rows,"2026-11-02","2026-11-02").map(x=>x.id)).toEqual(["a"]));
 it("excludes missing timestamps only when date filtering",()=>expect(filterRunsByStartDate(rows,"2026-11-03","").map(x=>x.id)).toEqual(["b"]));
});
