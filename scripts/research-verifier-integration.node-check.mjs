import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const ticker="005930";
function record(i) {
  return {
    ticker,jobReference:"job-"+i,tradingDate:"2026-11-12",
    modelId:"research-v1",modelVersion:"v1",dataOrigin:"real",usageRestriction:"research_only",
    status:"completed",researchScore:0.7,researchSignal:"up",
    performanceApproved:false,forwardPredictionEligible:false,executionAuthorized:false,
    pitQualified:false,independentlyAuthenticatedChronology:false,independentlyAuthenticatedCustody:false,
  };
}
function page(offset,total=12) {
  return {
    schemaVersion:"daily_research_series_v1",ticker,
    totalRecords:total,limit:10,offset,availability:total?"recorded":"no_recorded_analysis",
    records:Array.from({length:Math.max(0,Math.min(10,total-offset))},(_,i)=>record(offset+i)),
    timestampAuthority:"local_operational_clock_not_authenticated",
    lastSuccessfulAnalyzedAt:null,lastSuccessfulTradingDate:null,lastSuccessfulDataOrigin:null,
  };
}
async function withServer(handler,run) {
  const server=createServer((req,res)=>{
    const result=handler(req);
    res.writeHead(result.status??200,{"Content-Type":"application/json"});
    res.end(JSON.stringify(result.body??{}));
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  try {return await run(server.address().port);}
  finally {await new Promise(resolve=>server.close(resolve));}
}
function invoke(port,token) {
  const env={...process.env,MARKET_LENS_DATA_SOURCE:"http",MARKET_LENS_VERIFY_TICKER:ticker,
    DONGHAK_API_BASE_URL:"http://127.0.0.1:"+port,
    DONGHAK_AI_MANAGEMENT_BASE_URL:token?"http://127.0.0.1:"+port:"",DONGHAK_AI_MANAGEMENT_TOKEN:token??""};
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,["scripts/verify-research-workspace-http.mjs"],{
      env,cwd:process.cwd(),stdio:["ignore","pipe","pipe"],
    });
    let stdout="",stderr="";
    child.stdout.on("data",data=>{stdout+=data.toString();});
    child.stderr.on("data",data=>{stderr+=data.toString();});
    child.once("error",reject);
    child.once("close",code=>resolve({code,stdout,stderr}));
  });
}
test("local operator verification checks both pages without starting any research", async()=>{
  const methods=[];
  await withServer(req=>{
    methods.push(req.method);
    if(req.url==="/api/v1/health")return {body:{status:"ok",service:"DonghakStockVision",mode:"read_only"}};
    if(req.url?.includes("research-analysis"))return {body:page(req.url.includes("offset=10")?10:0)};
    return {status:404};
  },async port=>{
    const outcome=await invoke(port);
    assert.equal(outcome.code,0);
    const report=JSON.parse(outcome.stdout);
    assert.deepEqual(report.dailyResearch,{publishedTotal:12,checkedPages:2,checkedRecords:12,
      previewCount:10,previewCompleted:10,previewPending:0,previewBlocked:0,previewFailed:0,
      previewReal:10,previewSynthetic:0});
    assert.deepEqual([...new Set(methods)],["GET"]);
    assert.equal(outcome.stdout.includes("job-"),false);
  });
});
test("operator check detects changed publication while paging and hides partial report",async()=>{
  await withServer(req=>{
    if(req.url==="/api/v1/health")return {body:{status:"ok",service:"DonghakStockVision",mode:"read_only"}};
    if(req.url?.includes("research-analysis"))return {body:page(req.url.includes("offset=10")?10:0,req.url.includes("offset=10")?15:12)};
    return {status:404};
  },async port=>{
    const outcome=await invoke(port);
    assert.equal(outcome.code,1);
    assert.equal(outcome.stdout,"");
    assert.equal(JSON.parse(outcome.stderr).stage,"pagination");
  });
});
test("optional authenticated management is read-only and secrets never appear in logs",async()=>{
  const requests=[],secret="VERY_SECRET_READ_TOKEN";
  await withServer(req=>{
    requests.push({method:req.method,url:req.url,auth:req.headers.authorization});
    if(req.url==="/api/v1/health")return {body:{status:"ok",service:"DonghakStockVision",mode:"read_only"}};
    if(req.url?.includes("research-analysis"))return {body:page(req.url.includes("offset=10")?10:0)};
    if(req.url==="/api/v1/ai/models")return {body:{models:[{key:"gemma4"}]}};
    if(req.url==="/api/v1/ai/models/active")return {body:{busy:false,selectedModelKey:null,defaultModelKey:"gemma-default",selectionVersion:3}};
    if(req.url==="/api/v1/ai/models/history")return {body:{history:[]}};
    if(req.url==="/api/v1/ai/models/comparisons")return {body:{comparisons:[{comparisonContractId:"group1"}]}};
    return {status:404};
  },async port=>{
    const result=await invoke(port,secret);
    assert.equal(result.code,0);
    const report=JSON.parse(result.stdout);
    assert.equal(report.management.status,"authenticated_read_only");
    assert.equal(report.management.comparisonRecordsReturned,1);
    assert.equal(requests.filter(r=>r.url.includes("/ai/models")).length,4);
    assert.ok(requests.filter(r=>r.url.includes("/ai/models")).every(r=>r.auth==="Bearer "+secret));
    assert.ok(requests.every(r=>r.method==="GET"));
    assert.equal((result.stdout+result.stderr).includes(secret),false);
  });
});
test("permission errors report safe stage only and do not expose upstream body",async()=>{
  await withServer(req=>{
    if(req.url==="/api/v1/health")return {body:{status:"ok",service:"DonghakStockVision",mode:"read_only"}};
    if(req.url?.includes("research-analysis"))return {body:page(req.url.includes("offset=10")?10:0)};
    return {status:403,body:{detail:"DO_NOT_PRINT_PRIVATE_TOKEN"}};
  },async port=>{
    const result=await invoke(port,"unused-secret");
    assert.equal(result.code,1);
    const diagnostic=JSON.parse(result.stderr);
    assert.ok(diagnostic.stage.startsWith("management_"));
    assert.equal(diagnostic.reason,"Insufficient read permission");
    assert.equal(result.stderr.includes("DO_NOT_PRINT_PRIVATE_TOKEN"),false);
  });
});
