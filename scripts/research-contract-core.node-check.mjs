import test from "node:test";
import assert from "node:assert/strict";
import {
  localResearchOrigin, validateHealth, validateResearchPage, validatePageContinuity,
  validateManagement, ResearchContractError,
} from "./research-contract-core.mjs";

const ticker="005930";
function record(n,overrides={}) {
  return {
    ticker,jobReference:"job"+n,tradingDate:"2026-11-12",status:"completed",
    modelId:"direction",modelVersion:"v1",dataOrigin:"real",usageRestriction:"research_only",
    performanceApproved:false,forwardPredictionEligible:false,executionAuthorized:false,
    pitQualified:false,independentlyAuthenticatedChronology:false,independentlyAuthenticatedCustody:false,
    researchScore:0.72,researchSignal:"up",...overrides,
  };
}
function page(total,offset=0,records=[],limit=10) {
  return {
    schemaVersion:"daily_research_series_v1",ticker,availability:total?"recorded":"no_recorded_analysis",
    records,totalRecords:total,offset,limit,timestampAuthority:"local_operational_clock_not_authenticated",
    lastSuccessfulAnalyzedAt:null,lastSuccessfulTradingDate:null,lastSuccessfulDataOrigin:null,
  };
}
const invalid = fn => assert.throws(fn,ResearchContractError);

test("strict local loopback destination parsing prohibits remote, credentials and path injection",()=>{
  assert.equal(localResearchOrigin("http://localhost:8000/"),"http://localhost:8000");
  assert.equal(localResearchOrigin("http://127.0.0.1:8001/",true),"http://127.0.0.1:8001");
  for (const url of ["https://example.com","http://192.168.1.2:8000","http://localhost:8000/private",
    "http://user:pass@127.0.0.1:8000","http://localhost:99999","http://localhost:80?x=1"]) {
    assert.equal(localResearchOrigin(url),null);
  }
  assert.equal(localResearchOrigin("http://localhost:8000",true),null);
});
test("health only accepts an exact read-only backend identity",()=>{
  assert.deepEqual(validateHealth({status:"ok",service:"DonghakStockVision",mode:"read_only"}),{status:"ok"});
  invalid(()=>validateHealth({status:"ok",service:"Different",mode:"read_only"}));
  invalid(()=>validateHealth({status:"ok",service:"DonghakStockVision",mode:"trading"}));
});
test("daily publication validates complete first and empty pages without inferring quality",()=>{
  assert.equal(validateResearchPage(page(1,0,[record(1)]),ticker,10,0).completed,1);
  assert.equal(validateResearchPage(page(0),ticker,10,0).previewCount,0);
  assert.equal(validateResearchPage(page(1,0,[record(1,{researchScore:null,researchSignal:"neutral"})]),ticker,10,0).completed,1);
});
test("daily publication refuses missing pages, duplicate jobs and altered source semantics",()=>{
  invalid(()=>validateResearchPage(page(12,0,[record(1)]),ticker,10,0));
  invalid(()=>validateResearchPage(page(2,0,[record(1),record(1)]),ticker,10,0));
  invalid(()=>validateResearchPage(page(1,0,[record(1,{performanceApproved:true})]),ticker,10,0));
  invalid(()=>validateResearchPage(page(1,0,[record(1,{dataOrigin:"synthetic_fixture"})]),ticker,10,0));
  invalid(()=>validateResearchPage(page(1,0,[record(1,{status:"pending",researchScore:0.7})]),ticker,10,0));
  invalid(()=>validateResearchPage({...page(0),offset:1},ticker,10,0));
});
test("two consecutive pages enforce stable count, unique jobs and order",()=>{
  const first=validateResearchPage(page(12,0,Array.from({length:10},(_,i)=>record(i))),ticker,10,0);
  const second=validateResearchPage(page(12,10,[record(10),record(11)]),ticker,10,10);
  assert.equal(validatePageContinuity(first,second),true);
  invalid(()=>validatePageContinuity(first,{...second,totalRecords:99}));
  invalid(()=>validatePageContinuity(first,{...second,jobReferences:["job0","job11"]}));
  invalid(()=>validatePageContinuity(first,{...second,offset:11}));
  invalid(()=>validatePageContinuity(first,{...second,firstDate:"2026-11-13"}));
});
test("management enforces bounded contract arrays and active selection",()=>{
  const active={selectionVersion:2,busy:false,selectedModelKey:null,defaultModelKey:"gemma-default"};
  assert.deepEqual(validateManagement({models:[{key:"gemma-default"}]},active,{history:[]},{comparisons:[{runId:"r"}]}),
    {registeredModelsReturned:1,comparisonRecordsReturned:1,historyRecordsReturned:0,
     selectionVersion:2,selectionBusy:false});
  invalid(()=>validateManagement({models:42},active,{history:[]},{comparisons:[]}));
  invalid(()=>validateManagement({models:[]},{...active,busy:"false"},{history:[]},{comparisons:[]}));
  invalid(()=>validateManagement({models:[]},active,{history:[]},{comparisons:150}));
});
test("diagnostic failures identify stage without exposing opaque inputs",()=>{
  try { validateResearchPage(page(5),ticker,10,0); assert.fail("Expected failure"); }
  catch(e) { assert.equal(e.stage,"daily_research"); assert.equal(e.message.includes("job"),false); }
});
