// Live, local-only, GET-only audit. Passing offline fixtures never certifies real market E2E.
import {pathToFileURL} from "node:url";

const LOOPBACK=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
const TICKER=/^[0-9A-Z]{6}$/;
const HASH=/^[a-f0-9]{64}$/;
const LAYER=/^(calendar|settlement|dart|security-lifecycle|corporate-actions)$/;
const directions=new Set(["up","down"]);
const endpoints=[
 {name:"project",path:"/api/v1/project/status",check:v=>obj(v)&&typeof v.productName==="string"&&Array.isArray(v.metrics)&&Array.isArray(v.evidence)&&Array.isArray(v.baseline)},
 {name:"coverage",path:"/api/v1/research/coverage",check:v=>obj(v)&&Number.isSafeInteger(v.universe)&&v.universe>=0},
 {name:"models",path:"/api/v1/models",check:v=>Array.isArray(v)&&v.length<=2&&v.every(x=>obj(x)&&directions.has(x.id)&&typeof x.modelName==="string")&&new Set(v.map(x=>x.id)).size===v.length},
 {name:"evidence",path:"/api/v1/evidence",check:v=>Array.isArray(v)&&v.length<=5&&v.every(x=>obj(x)&&LAYER.test(x.id)&&typeof x.title==="string")&&new Set(v.map(x=>x.id)).size===v.length},
 {name:"baseline",path:"/api/v1/backtests/baseline",check:v=>obj(v)&&v.id==="baseline"&&v.performanceAvailable===false},
 {name:"stocks",path:"/api/v1/stocks",check:v=>Array.isArray(v)&&v.every(x=>obj(x)&&TICKER.test(x.ticker))&&new Set(v.map(x=>x.ticker)).size===v.length},
 {name:"operational",path:"/api/v1/operational/stocks?offset=0&limit=25",check:v=>obj(v)&&v.schemaVersion==="operational_market_v1"&&v.evidenceStatus==="unreviewed"&&v.offset===0&&v.limit===25&&Number.isSafeInteger(v.total)&&v.total>=0&&Array.isArray(v.items)&&v.items.length<=25&&v.items.length<=v.total&&v.items.every(x=>obj(x)&&TICKER.test(x.ticker)&&date(x.latestDataDate))},
 {name:"operations",path:"/api/v1/operations/runs?offset=0&limit=25",check:v=>obj(v)&&v.schemaVersion==="operations_v1"&&v.offset===0&&v.limit===25&&Number.isSafeInteger(v.total)&&v.total>=0&&Array.isArray(v.items)&&v.items.length<=25},
 {name:"freshness",path:"/api/v1/operations/freshness",check:v=>obj(v)&&v.schemaVersion==="operations_v1"&&Array.isArray(v.items)},
 {name:"alerts",path:"/api/v1/operations/alerts?offset=0&limit=25",check:v=>obj(v)&&v.schemaVersion==="operations_v1"&&v.offset===0&&v.limit===25&&Number.isSafeInteger(v.total)&&v.total>=0&&Array.isArray(v.items)&&v.items.length<=25},
 {name:"screener",path:"/api/v1/analysis/screener",check:v=>obj(v)&&Array.isArray(v.entries)},
 {name:"historical-portfolio-catalog",path:"/api/v1/research/historical-portfolios?offset=0&limit=10",check:v=>obj(v)&&v.schemaVersion==="published_historical_portfolio_v1"&&v.offset===0&&v.limit===10&&Number.isSafeInteger(v.total)&&v.total>=0&&Array.isArray(v.items)&&v.items.length<=10&&v.items.every(x=>obj(x)&&HASH.test(x.reportId))}
];
const pages=["/","/stocks","/models","/operations","/operations/trace","/diagnostics","/evidence","/screener","/research-workbench","/research-path","/backtesting","/backtesting/portfolios"];
function obj(v){return v!==null&&typeof v==="object"&&!Array.isArray(v);}
function date(v){return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+"T00:00:00Z"));}
function normalize(raw){return typeof raw==="string"?raw.trim().replace(/\/+$/,""):"";}
function ensure(value,message){if(!value)throw Error(message);}
function row(name,status,detail){return {name,status,detail};}
async function get(url,fetchImpl,accept="application/json"){
 try{return await fetchImpl(url,{method:"GET",headers:{Accept:accept},cache:"no-store",signal:AbortSignal.timeout(8000)});}
 catch{return null;}
}
async function parse(response){try{return await response.json();}catch{return null;}}
function first(items,predicate){return items.find(predicate)??null;}

/** Check an existing, fixed local API endpoint. 503 means no optional publication. */
async function checkJson(name,url,check,fetchImpl,checks,payloads){
 const response=await get(url,fetchImpl);
 if(!response){checks.push(row(name,"failed","Local HTTP endpoint unreachable"));return;}
 if(response.status===503){checks.push(row(name,"unconfigured","Backend returned HTTP 503"));return;}
 if(!response.ok){checks.push(row(name,"failed","HTTP "+response.status));return;}
 const value=await parse(response);
 if(!check(value)){checks.push(row(name,"failed","Response contract mismatch"));return;}
 payloads.set(name,value);
 const count=Array.isArray(value)?value.length:Array.isArray(value.items)?value.items.length:Array.isArray(value.entries)?value.entries.length:Array.isArray(value.records)?value.records.length:Array.isArray(value.bars)?value.bars.length:null;
 checks.push(row(name,count===0?"empty":"available",count===null?"Response shape verified":"Returned "+count+" records"));
}
/** Dynamic URLs are built only from validated identifiers returned by the backend. */
async function dynamicApi(b,fetchImpl,checks,payloads){
 const stocks=payloads.get("stocks");
 const coverage=payloads.get("coverage");
 if(stocks&&coverage&&stocks.length!==coverage.universe)
  checks.push(row("research-stock-count-parity","failed","Research universe and stock list disagree"));
 else if(stocks&&coverage)
  checks.push(row("research-stock-count-parity","available","Research universe count matches returned stock list"));
 else checks.push(row("research-stock-count-parity","not_tested","Requires both a research coverage and stock list publication"));
 const ticker=stocks?first(stocks,x=>TICKER.test(x.ticker))?.ticker:null;
 if(ticker){
  const path=encodeURIComponent(ticker);
  await checkJson("stock-detail",b+"/api/v1/stocks/"+path,v=>obj(v)&&v.ticker===ticker&&v.dataStatus==="api",fetchImpl,checks,payloads);
  await checkJson("ticker-analysis",b+"/api/v1/stocks/"+path+"/analysis",v=>obj(v)&&v.ticker===ticker&&Array.isArray(v.records),fetchImpl,checks,payloads);
  await checkJson("stock-ohlcv",b+"/api/v1/stocks/"+path+"/ohlcv",v=>obj(v)&&v.ticker===ticker&&Array.isArray(v.bars),fetchImpl,checks,payloads);
 }else checks.push(row("stock-detail","not_tested","No published research ticker available to verify detail or OHLCV"));
 const models=payloads.get("models");
 if(models?.length)for(const model of models)
  await checkJson("model-detail:"+model.id,b+"/api/v1/models/"+model.id,v=>obj(v)&&v.id===model.id&&obj(v.provenance)&&obj(v.validation)&&obj(v.oos),fetchImpl,checks,payloads);
 else checks.push(row("model-details","not_tested","No published model directions available"));
 const layers=payloads.get("evidence");
 if(layers?.length)for(const layer of layers)
  await checkJson("evidence-detail:"+layer.id,b+"/api/v1/evidence/"+layer.id,v=>obj(v)&&v.id===layer.id&&Array.isArray(v.findings)&&Array.isArray(v.metrics),fetchImpl,checks,payloads);
 else checks.push(row("evidence-details","not_tested","No published evidence layers available"));
 const archive=payloads.get("historical-portfolio-catalog");
 const report=archive?first(archive.items,x=>HASH.test(x.reportId))?.reportId:null;
 if(report)await checkJson("historical-portfolio-detail",b+"/api/v1/research/historical-portfolios/"+report,
  v=>obj(v)&&v.reportId===report&&v.researchOnly===true&&v.executable===false,fetchImpl,checks,payloads);
 else checks.push(row("historical-portfolio-detail","not_tested","No published portfolio available for detail verification"));
 // Comparison is a read-only semantic POST, but this GET-only audit never executes it.
 checks.push(row("portfolio-comparison","not_tested","Comparison needs POST with 2-5 verified report IDs; not executed by GET-only audit"));
 return {ticker,report};
}
async function checkPage(name,url,fetchImpl,checks){
 const response=await get(url,fetchImpl,"text/html");
 if(!response?.ok){checks.push(row(name,"failed","Web route HTTP "+(response?.status??"network error")));return;}
 const type=response.headers.get("content-type")??"";
 const html=await response.text().catch(()=>"");
 checks.push(row(name,type.includes("text/html")&&html.length>0?"available":"failed",
  type.includes("text/html")&&html.length>0?"Nonempty HTML returned (not a browser interaction test)":"Expected nonempty HTML"));
}

/**
 * Live service reachability and limited data contract smoke test. Does not certify market
 * values, functional browser interaction, completeness, investment suitability or trading.
 */
export async function auditWebBackendIntegration({backend,web,dataSource,fetchImpl=fetch}){
 const b=normalize(backend),w=normalize(web);
 ensure(dataSource==="http","MARKET_LENS_DATA_SOURCE must be http");
 ensure(LOOPBACK.test(b)&&LOOPBACK.test(w),"Both endpoints must be explicit loopback HTTP URLs");
 ensure(b!==w,"Backend and frontend must be distinct local services");
 const healthResponse=await get(b+"/api/v1/health",fetchImpl);
 ensure(healthResponse?.ok,"Backend health did not respond successfully");
 const health=await parse(healthResponse);
 ensure(health?.status==="ok"&&health.service==="DonghakStockVision"&&health.mode==="read_only",
  "Backend health contract mismatch: expected read-only DonghakStockVision");
 const checks=[];
 const payloads=new Map();
 for(const endpoint of endpoints)
  await checkJson(endpoint.name,b+endpoint.path,endpoint.check,fetchImpl,checks,payloads);
 const {ticker,report}=await dynamicApi(b,fetchImpl,checks,payloads);
 const webHealthResponse=await get(w+"/api/health",fetchImpl);
 const webHealth=webHealthResponse?await parse(webHealthResponse):null;
 if(!webHealth||webHealth.dataSource!=="http"||webHealth.app!=="TrisMarketLens")
  checks.push(row("web-health","failed","Web health unavailable or not configured for HTTP"));
 else if(webHealthResponse.status!==200||webHealth.status!=="ok"||webHealth.backend?.status!=="ok")
  checks.push(row("web-health","failed","Web health reports degraded backend"));
 else checks.push(row("web-health","available","Web reports connected HTTP transport"));
 const catalog=payloads.get("operational");
 if(catalog&&webHealth?.operationalMarket){
  const market=webHealth.operationalMarket;
  checks.push(market.observedTickers!==catalog.total||
   market.status!==(catalog.total>0?"available":"empty")?
   row("operational-parity","failed","Web/backend operational counts or states disagree"):
   row("operational-parity","available","Unreviewed observed ticker count matches"));
 }else checks.push(row("operational-parity","not_tested","Operational catalog or web-market health not available"));
 for(const page of pages)await checkPage("page:"+page,w+page,fetchImpl,checks);
 if(ticker){
  await checkPage("page:/stocks/[ticker]",w+"/stocks/"+ticker,fetchImpl,checks);
  await checkPage("page:/research-path?ticker",w+"/research-path?ticker="+ticker,fetchImpl,checks);
  await checkPage("page:/research-workbench?ticker",w+"/research-workbench?ticker="+ticker,fetchImpl,checks);
 }
 if(report)await checkPage("page:/backtesting/portfolios/[reportId]",w+"/backtesting/portfolios/"+report,fetchImpl,checks);
 if(payloads.get("models")?.length)await checkPage("page:/models/[direction]",w+"/models/"+payloads.get("models")[0].id,fetchImpl,checks);
 const counts={
  failed:checks.filter(x=>x.status==="failed").length,
  unconfigured:checks.filter(x=>x.status==="unconfigured").length,
  empty:checks.filter(x=>x.status==="empty").length,
  notTested:checks.filter(x=>x.status==="not_tested").length
 };
 return {
  verifiedVia:"live_http_get",backend:b,web:w,transportVerified:true,
  result:counts.failed?"failed":counts.unconfigured||counts.empty||counts.notTested?"partial":"available",
  fullyConfigured:Object.values(counts).every(n=>n===0),
  browserInteractionsVerified:false,marketDataCorrectnessVerified:false,
  marketResearchApproved:false,realTradingVerified:false,
  checks,counts
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
  if(result.result!=="available")process.exitCode=1;
 }catch(error){
  console.error("Live integration audit could not be completed:",error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
