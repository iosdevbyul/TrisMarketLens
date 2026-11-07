import {test} from "node:test";
import assert from "node:assert/strict";
import {verifyOperationalWebE2E} from "./verify-operational-web-e2e.mjs";

const backend="http://127.0.0.1:8100";
const web="http://127.0.0.1:3000";
const ticker="005930";
const date="2026-10-30";
const json=(value,status=200)=>({
 ok:status>=200&&status<300,status,
 async json(){return value;},
 async text(){return JSON.stringify(value);}
});
const html=(body,status=200)=>({
 ok:status>=200&&status<300,status,
 async text(){return body;},
 async json(){throw Error("HTML cannot be JSON");}
});
const catalog=()=>({
 schemaVersion:"operational_market_v1",evidenceStatus:"unreviewed",
 total:1,offset:0,limit:25,items:[{ticker,latestDataDate:date}]
});
function responses(){
 return new Map([
  [web+"/api/health",json({status:"ok",dataSource:"http",backend:{status:"ok"},operationalMarket:{status:"available",observedTickers:1}})],
  [backend+"/api/v1/health",json({status:"ok",mode:"read_only"})],
  [backend+"/api/v1/operational/stocks?offset=0&limit=25",json(catalog())],
  [backend+"/api/v1/operational/stocks/"+ticker+"/ohlcv",json({ticker,bars:[{date,open:100,high:120,low:90,close:110,volume:10}]})],
  [web+"/",html("<h1>Collected KRX observations</h1>"+ticker)],
  [web+"/operational-market",html("Observed: "+ticker+" total 1")],
  [web+"/operational-market/"+ticker,html(ticker+" "+date)],
  [web+"/diagnostics?ticker="+ticker,html("Collected KRX data 1")]
 ]);
}
function runner(map,overrides={}){
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(!map.has(url))throw Error("Unexpected fixture endpoint: "+url);
  const reply=map.get(url);
  return typeof reply==="function"?reply(options):reply;
 };
 return {calls,verify:()=>verifyOperationalWebE2E({backend,web,dataSource:"http",fetchImpl,...overrides})};
}
test("fixture-backed HTTP mode verifies all read-only endpoints and HTML surfaces",async()=>{
 const {calls,verify}=runner(responses());
 assert.deepEqual(await verify(),{total:1,ticker,bars:1,lastDate:date});
 assert.equal(calls.length,8);
 assert.ok(calls.every(({url,options})=>url.startsWith("http://127.0.0.1:")&&
  options.cache==="no-store"&&options.signal instanceof AbortSignal));
 assert.equal(calls.filter(x=>x.options.headers.Accept==="text/html").length,4);
});
test("rejects non-http mode and non-loopback URLs before any transport call",async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;throw Error("should not call transport");};
 for(const options of [
  {backend,web,dataSource:"demo"},
  {backend:"https://real-provider.example",web,dataSource:"http"},
  {backend,web:"http://external.example",dataSource:"http"}
 ])await assert.rejects(()=>verifyOperationalWebE2E({...options,fetchImpl}),/http|loopback/);
 assert.equal(calls,0);
});
test("rejects unhealthy backend, demo web mode and disagreeing catalog totals",async()=>{
 const scenarios=[
  [backend+"/api/v1/health",json({status:"ok",mode:"read_write"}),/read-only/],
  [web+"/api/health",json({status:"ok",dataSource:"demo",backend:{status:"ok"}}),/healthy read-only backend/],
  [web+"/api/health",json({status:"ok",dataSource:"http",backend:{status:"ok"},operationalMarket:{status:"available",observedTickers:2}}),/ticker count/]
 ];
 for(const [url,value,reason] of scenarios){
  const map=responses();map.set(url,value);
  await assert.rejects(runner(map).verify(),reason);
 }
});
test("rejects empty, partial and malformed operational catalogs",async()=>{
 const cases=[
  {...catalog(),total:0,items:[]},
  {...catalog(),items:[]},
  {...catalog(),total:1,offset:1},
  {...catalog(),items:[{ticker:"BAD",latestDataDate:date}]},
  {...catalog(),items:[{ticker,latestDataDate:"2026-02-30"}]}
 ];
 for(const value of cases){
  const map=responses();map.set(backend+"/api/v1/operational/stocks?offset=0&limit=25",json(value));
  await assert.rejects(runner(map).verify(),/catalog|ticker\/date/);
 }
});
test("rejects empty, partial, inconsistent and reversed OHLCV series",async()=>{
 const series=[
  {ticker,bars:[]},
  {ticker,bars:[{date:"2026-10-29"}]},
  {ticker,bars:[{date},{date:"2026-10-29"}]},
  {ticker,bars:[{date:"2026-02-30"}]},
  {ticker:"000660",bars:[{date}]}
 ];
 for(const value of series){
  const map=responses();map.set(backend+"/api/v1/operational/stocks/"+ticker+"/ohlcv",json(value));
  await assert.rejects(runner(map).verify(),/OHLCV|Catalog latest date/);
 }
});
test("propagates HTTP errors, timeouts and missing web page evidence",async()=>{
 const failures=[
  [backend+"/api/v1/health",json({message:"not found"},503),/HTTP 503/],
  [web+"/operational-market",html("missing",404),/HTTP 404/],
  [web+"/",html("<h1>Demo dashboard</h1>"),/Home page/],
  [web+"/operational-market/"+ticker,html(ticker),/Ticker detail/],
  [web+"/diagnostics?ticker="+ticker,html("not connected"),/Diagnostics/]
 ];
 for(const [url,value,pattern] of failures){
  const map=responses();map.set(url,value);
  await assert.rejects(runner(map).verify(),pattern);
 }
 const map=responses();
 map.set(backend+"/api/v1/health",async()=>{throw new DOMException("The operation was aborted","TimeoutError");});
 await assert.rejects(runner(map).verify(),{name:"TimeoutError"});
});
