// Read-only backend ↔ web integration audit.
// Live HTTP runs only through this script's CLI. Fixture tests never certify real-data E2E.
import {pathToFileURL} from "node:url";

const LOOPBACK=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const endpoints=[
 {name:"project",path:"/api/v1/project/status",check:v=>object(v)&&typeof v.productName==="string"&&Array.isArray(v.metrics)},
 {name:"coverage",path:"/api/v1/research/coverage",check:v=>object(v)&&Number.isSafeInteger(v.universe)&&v.universe>=0},
 {name:"models",path:"/api/v1/models",check:v=>Array.isArray(v)&&v.every(x=>object(x)&&["up","down"].includes(x.id))},
 {name:"evidence",path:"/api/v1/evidence",check:v=>Array.isArray(v)&&v.every(x=>object(x)&&typeof x.id==="string")},
 {name:"baseline",path:"/api/v1/backtests/baseline",check:v=>object(v)&&v.id==="baseline"&&v.performanceAvailable===false},
 {name:"stocks",path:"/api/v1/stocks",check:v=>Array.isArray(v)&&v.every(x=>object(x)&&/^[0-9A-Z]{6}$/.test(x.ticker))},
 {name:"operational",path:"/api/v1/operational/stocks?offset=0&limit=25",check:v=>object(v)&&v.schemaVersion==="operational_market_v1"&&v.evidenceStatus==="unreviewed"&&v.offset===0&&v.limit===25&&Number.isSafeInteger(v.total)&&v.total>=0&&Array.isArray(v.items)&&v.items.length<=25&&v.items.every(x=>object(x)&&/^[0-9A-Z]{6}$/.test(x.ticker)&&typeof x.latestDataDate==="string"&&DAY.test(x.latestDataDate))},
 {name:"operations",path:"/api/v1/operations/runs?offset=0&limit=25",check:v=>object(v)&&Array.isArray(v.items||v.runs)},
 {name:"freshness",path:"/api/v1/operations/freshness",check:v=>object(v)},
 {name:"alerts",path:"/api/v1/operations/alerts?offset=0&limit=25",check:v=>object(v)&&Array.isArray(v.items||v.alerts)},
 {name:"screener",path:"/api/v1/analysis/screener",check:v=>object(v)&&Array.isArray(v.entries)}
];
const pages=["/","/stocks","/models","/operations","/diagnostics","/backtesting/portfolios"];
function object(v){return v!==null&&typeof v==="object"&&!Array.isArray(v);}
function normalize(raw){return typeof raw==="string"?raw.trim().replace(/\/+$/,""):"";}
function ensure(value,message){if(!value)throw Error(message);}
async function get(url,fetchImpl,accept="application/json"){
 try{return await fetchImpl(url,{method:"GET",headers:{Accept:accept},cache:"no-store",signal:AbortSignal.timeout(8000)});}
 catch{return null;}
}
async function json(response){try{return await response.json();}catch{return null;}}
function result(name,status,detail){return {name,status,detail};}

/**
 * Actual live checks require a running operator-owned backend and web on the same host.
 * A backend 503 is a documented missing optional publication, not evidence of a broken website.
 */
export async function auditWebBackendIntegration({backend,web,dataSource,fetchImpl=fetch}){
 const b=normalize(backend),w=normalize(web);
 ensure(dataSource==="http","MARKET_LENS_DATA_SOURCE must be http");
 ensure(LOOPBACK.test(b)&&LOOPBACK.test(w),"Both endpoints must be explicit loopback HTTP URLs");
 ensure(b!==w,"Backend and frontend must be distinct local services");
 const healthResponse=await get(b+"/api/v1/health",fetchImpl);
 ensure(healthResponse?.ok,"Backend health did not respond successfully");
 const health=await json(healthResponse);
 ensure(health?.status==="ok"&&health.service==="DonghakStockVision"&&health.mode==="read_only",
  "Backend health contract mismatch: expected read-only DonghakStockVision");
 const checks=[];
 const payloads=new Map();
 for(const endpoint of endpoints){
  const response=await get(b+endpoint.path,fetchImpl);
  if(!response){checks.push(result(endpoint.name,"failed","Backend endpoint unreachable"));continue;}
  if(response.status===503){checks.push(result(endpoint.name,"unconfigured","Backend reported HTTP 503"));continue;}
  if(!response.ok){checks.push(result(endpoint.name,"failed","Backend returned HTTP "+response.status));continue;}
  const value=await json(response);
  if(!endpoint.check(value)){checks.push(result(endpoint.name,"failed","Response contract mismatch"));continue;}
  payloads.set(endpoint.name,value);
  const count=Array.isArray(value)?value.length:Array.isArray(value.items)?value.items.length:Array.isArray(value.entries)?value.entries.length:null;
  checks.push(result(endpoint.name,count===0?"empty":"available",count===null?"Contract accepted":"Returned "+count+" records"));
 }
 const webHealthResponse=await get(w+"/api/health",fetchImpl);
 const webHealth=webHealthResponse?await json(webHealthResponse):null;
 if(!webHealth||webHealth.dataSource!=="http"||webHealth.app!=="TrisMarketLens"){
  checks.push(result("web-health","failed","Web health unavailable or not configured for HTTP"));
 }else if(webHealthResponse.status!==200||webHealth.status!=="ok"||webHealth.backend?.status!=="ok"){
  checks.push(result("web-health","failed","Web health reports degraded backend"));
 }else{
  checks.push(result("web-health","available","Web reports connected HTTP transport"));
 }
 const catalog=payloads.get("operational");
 if(catalog&&webHealth?.operationalMarket){
  const webMarket=webHealth.operationalMarket;
  if(webMarket.observedTickers!==catalog.total||
     webMarket.status!==(catalog.total>0?"available":"empty")){
    checks.push(result("operational-parity","failed","Web/backend operational catalog counts or states disagree"));
  }else{
    checks.push(result("operational-parity","available","Observed ticker count matches (unreviewed data only)"));
  }
 }
 for(const page of pages){
  const response=await get(w+page,fetchImpl,"text/html");
  if(!response?.ok){
   checks.push(result("page:"+page,"failed","Web route unavailable or HTTP "+(response?.status??"network error")));
   continue;
  }
  const type=response.headers.get("content-type")??"";
  const html=await response.text().catch(()=>"");
  checks.push(result("page:"+page,type.includes("text/html")&&html.length>0?"available":"failed",
   type.includes("text/html")&&html.length>0?"HTML response delivered":"Expected non-empty HTML"));
 }
 const failed=checks.filter(x=>x.status==="failed");
 const unconfigured=checks.filter(x=>x.status==="unconfigured");
 const empty=checks.filter(x=>x.status==="empty");
 return {
  verifiedVia:"live_http_get",backend:b,web:w,
  transportVerified:true,
  result:failed.length?"failed":unconfigured.length||empty.length?"partial":"available",
  fullyConfigured:failed.length===0&&unconfigured.length===0&&empty.length===0,
  marketResearchApproved:false,
  realTradingVerified:false,
  checks,
  counts:{failed:failed.length,unconfigured:unconfigured.length,empty:empty.length}
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const result=await auditWebBackendIntegration({
   backend:process.env.DONGHAK_API_BASE_URL,
   web:process.env.MARKET_LENS_URL??"http://127.0.0.1:3000",
   dataSource:process.env.MARKET_LENS_DATA_SOURCE
  });
  console.log(JSON.stringify(result,null,2));
  // Readiness cannot be asserted if the backend does not actually provide the data.
  if(result.result!=="available")process.exitCode=1;
 }catch(error){
  console.error("Live integration audit could not be completed:",error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
