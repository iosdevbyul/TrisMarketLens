import { describe, expect, it } from "vitest";
import { researchDiagnosticActions } from "./researchDiagnosticActions";
import type { ResearchSourceRow } from "./researchSourceStatus";

const row = (id: string, status: ResearchSourceRow["status"]): ResearchSourceRow =>
  ({id,name:id,detail:"",count:null,href:"/stocks/005930",status});

describe("research integration remediation guidance",()=>{
  it("links the independent blocked sources without triggering any operation",()=>{
    const result = researchDiagnosticActions([
      row("backend","unavailable"),row("model","disconnected"),
      row("comparison","unavailable"),row("daily","unavailable"),
    ]);
    expect(result.map(action=>action.id)).toEqual(["backend","model","comparisons","daily"]);
    expect(result.map(action=>action.href)).toEqual([
      "/diagnostics","/ai-research-models","/ai-research-models","/stocks/005930",
    ]);
    expect(result.every(action=>action.severity==="review")).toBe(true);
  });
  it("does not confuse empty evidence with failed requests",()=>{
    expect(researchDiagnosticActions([
      row("backend","available"),row("model","empty"),
      row("comparison","empty"),row("daily","empty"),
    ])).toEqual([]);
  });
  it("asks for ticker selection without making one up",()=>{
    const result=researchDiagnosticActions([row("daily","not_checked")]);
    expect(result).toMatchObject([{id:"ticker",severity:"info",href:"/research-status"}]);
  });
  it("never creates next steps based on hypothetical hidden sources",()=>{
    expect(researchDiagnosticActions([])).toEqual([]);
  });
});
