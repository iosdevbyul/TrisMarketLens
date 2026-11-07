import test from "node:test";
import assert from "node:assert/strict";
import {auditWebBackendIntegration} from "./audit-web-backend-integration.mjs";

const backend="http://127.0.0.1:8000",web="http://127.0.0.1:3000";
const health={status:"ok",service:"DonghakStockVision",mode:"read_only"};
const bBodies={
 "/api/v1/health":health,
 "/api/v1/project/status":{productName:"DonghakStockVision",metrics:[]},
 "/api/v1/research/coverage":{universe:1},
 "/api/v1/models":[{id:"up",modelName:"Research"}],
 "/api/v1/models/up":{id:"up",provenance:{artifactSha256:"a".repeat(64)},validation:{averagePrecision:0.6},oos:{averagePrecision:0.5}},
 "/api/v1/evidence":[{id:"calendar",title:"Calendar"}],
 "/api/v1/evidence/calendar":{id:"calendar",findings:[],metrics:[]},
 "/api/v1/backtests/baseline":{id:"baseline",performanceAvailable:false},
 "/api/v1/stocks":[{ticker:"005930"}],
 "/api/v1/stocks/005930":{ticker:"005930",dataStatus:"api"},
 "/api/v1/stocks/005930/analysis":{ticker:"005930",records:[]},
 "/api/v1/stocks/005930/ohlcv":{ticker:"005930",bars:[]},
 "/api/v1/operational/stocks?offset=0&limit=25":{
  schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",offset:0,limit:25,total:1,
  items:[{ticker:"005930",latestDataDate:"2026-11-06"}]
 },
 "/api/v1/operations/runs?offset=0&limit=25":{schemaVersion:"operations_v1",items:[]},
 "/api/v1/operations/freshness":{schemaVersion:"operations_v1",items:[]},
 "/api/v1/operations/alerts?offset=0&limit=25":{schemaVersion:"operations_v1",items:[]},
 "/api/v1/analysis/screener":{entries:[]},
 "/api/v1/research/historical-portfolios?offset=0&limit=10":{schemaVersion:"published_historical_portfolio_v1",offset:0,limit:10,total:0,items:[]}
};
const wHealth={
 status:"ok",app:"TrisMarketLens",dataSource:"http",backend:{status:"ok"},
 operationalMarket:{status:"available",observedTickers:1,evidenceStatus:"unreviewed"}
};
function mockFetch(changes={}){
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push([url,options]);
  const u=new URL(url);
  if(url===web+"/api/health")return Response.json(changes.webHealth??wHealth,{status:changes.webStatus??200});
  if(u.origin===web){
   return new Response(changes.html??"<html><body>Evidence page</body></html>",{status:changes.pageStatus??200,headers:{"content-type":"text/html"}});
  }
  assert.equal(u.origin,backend);
  const path=u.pathname+u.search;
  if(changes.failPath===path)throw Error("network unavailable");
  if(changes.unconfiguredPath===path)return new Response(null,{status:503});
  if(changes.errorPath===path)return new Response(null,{status:500});
  if(changes.invalidPath===path)return Response.json({unexpected:true});
  if(!Object.hasOwn(bBodies,path))throw Error("Unexpected endpoint "+path);
  return Response.json(bBodies[path]);
 };
 return {calls,fetchImpl};
}
const args=(fetchImpl)=>({backend,web,dataSource:"http",fetchImpl});

test("audits backend and HTML routes using only GET and never claims trading approval",async()=>{
 const {calls,fetchImpl}=mockFetch();
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.result,"partial"); // Missing published records are explicit empty outcomes.
 assert.equal(report.transportVerified,true);
 assert.equal(report.marketResearchApproved,false);
 assert.equal(report.realTradingVerified,false);
 assert.ok(report.checks.some(x=>x.name==="models"&&x.status==="available"));
 assert.ok(report.checks.some(x=>x.name==="operations"&&x.status==="empty"));
 assert.ok(report.checks.some(x=>x.name==="page:/diagnostics"&&x.status==="available"));
 assert.ok(calls.every(([,options])=>options.method==="GET"&&options.cache==="no-store"));
 assert.ok(calls.every(([url])=>url.startsWith(backend)||url.startsWith(web)));
});
test("distinguishes documented 503 unavailable from endpoint contract failure",async()=>{
 const {fetchImpl}=mockFetch({unconfiguredPath:"/api/v1/analysis/screener"});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="screener").status,"unconfigured");
 assert.equal(report.counts.failed,0);
 assert.equal(report.result,"partial");
});
test("rejects incompatible API data instead of counting it as live evidence",async()=>{
 const {fetchImpl}=mockFetch({invalidPath:"/api/v1/operational/stocks?offset=0&limit=25"});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="operational").status,"failed");
 assert.equal(report.result,"failed");
});
test("detects operational catalog parity mismatches without declaring market data valid",async()=>{
 const {fetchImpl}=mockFetch({webHealth:{...wHealth,operationalMarket:{status:"available",observedTickers:44}}});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="operational-parity").status,"failed");
});
test("distinguishes unavailable services and broken HTML pages",async()=>{
 const {fetchImpl}=mockFetch({failPath:"/api/v1/stocks",pageStatus:500});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="stocks").status,"failed");
 assert.equal(report.checks.find(x=>x.name==="page:/").status,"failed");
});
test("follows source-validated ticker, model and evidence IDs to real detail routes",async()=>{
 const {calls,fetchImpl}=mockFetch();
 const report=await auditWebBackendIntegration(args(fetchImpl));
 for(const name of ["stock-detail","ticker-analysis","stock-ohlcv","model-detail:up","evidence-detail:calendar","page:/stocks/[ticker]","page:/research-workbench?ticker"]){
  assert.equal(report.checks.find(x=>x.name===name)?.status===("ticker-analysis"===name||"stock-ohlcv"===name?"empty":"available"),true,name);
 }
 assert.ok(calls.some(([url])=>url===backend+"/api/v1/stocks/005930/analysis"));
 assert.ok(calls.some(([url])=>url===web+"/research-path?ticker=005930"));
 assert.equal(report.checks.find(x=>x.name==="portfolio-comparison").status,"not_tested");
 assert.equal(report.browserInteractionsVerified,false);
 assert.equal(report.marketDataCorrectnessVerified,false);
});
test("missing optional publication stays unconfigured and prevents full readiness",async()=>{
 const {fetchImpl}=mockFetch({unconfiguredPath:"/api/v1/research/historical-portfolios?offset=0&limit=10"});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="historical-portfolio-catalog").status,"unconfigured");
 assert.equal(report.checks.find(x=>x.name==="historical-portfolio-detail").status,"not_tested");
 assert.equal(report.fullyConfigured,false);
});
test("detects broken model detail contract and research catalog parity",async()=>{
 const {fetchImpl}=mockFetch({invalidPath:"/api/v1/models/up"});
 const report=await auditWebBackendIntegration(args(fetchImpl));
 assert.equal(report.checks.find(x=>x.name==="model-detail:up").status,"failed");
 assert.equal(report.result,"failed");
});
test("requires actual read-only backend, rejects remote hosts and demo mode before any request",async()=>{
 const {calls,fetchImpl}=mockFetch();
 await assert.rejects(auditWebBackendIntegration({backend:"https://production.example",web,dataSource:"http",fetchImpl}),/loopback/);
 await assert.rejects(auditWebBackendIntegration({...args(fetchImpl),dataSource:"mock"}),/must be http/);
 await assert.rejects(auditWebBackendIntegration({...args(fetchImpl),backend:web}),/distinct/);
 assert.equal(calls.length,0);
 const wrong=async url=>url===backend+"/api/v1/health"?
  Response.json({...health,mode:"trade_enabled"}):Response.json({});
 await assert.rejects(auditWebBackendIntegration(args(wrong)),/health contract mismatch/);
});
