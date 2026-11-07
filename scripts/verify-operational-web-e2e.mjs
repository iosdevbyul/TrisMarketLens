// Read-only operational backend/web verification. Real HTTP is used only by the CLI entry point.
// Injecting fetch in tests verifies contracts; fixtures never certify live-data readiness.
import {pathToFileURL} from "node:url";

const loopback=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
const tickerPattern=/^[0-9A-Z]{6}$/;
function assert(condition,message){if(!condition)throw Error(message);}
function endpoint(raw){
 return (raw??"").trim().replace(/\/+$/,"");
}
function validDay(day){
 return typeof day==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&
  !Number.isNaN(Date.parse(day+"T00:00:00Z"))&&
  new Date(day+"T00:00:00Z").toISOString().slice(0,10)===day;
}

/** Verify a bounded, read-only HTTP contract. Never substitute a sample response for a live observation. */
export async function verifyOperationalWebE2E({backend,web,dataSource,fetchImpl=fetch}){
 backend=endpoint(backend);web=endpoint(web);
 assert(dataSource==="http","MARKET_LENS_DATA_SOURCE must be http");
 assert(loopback.test(backend)&&loopback.test(web),"Both URLs must point to explicit loopback HTTP services");
 async function request(url,accept="application/json"){
  const result=await fetchImpl(url,{headers:{Accept:accept},cache:"no-store",signal:AbortSignal.timeout(8000)});
  assert(result.ok,url+" returned HTTP "+result.status);
  return result;
 }
 const [healthResponse,catalogResponse,backendHealthResponse]=await Promise.all([
  request(web+"/api/health"),
  request(backend+"/api/v1/operational/stocks?offset=0&limit=25"),
  request(backend+"/api/v1/health")
 ]);
 const [health,catalog,backendHealth]=await Promise.all([
  healthResponse.json(),catalogResponse.json(),backendHealthResponse.json()
 ]);
 assert(backendHealth?.status==="ok"&&backendHealth?.mode==="read_only",
  "Backend is not healthy and read-only");
 assert(health?.status==="ok"&&health.dataSource==="http"&&health.backend?.status==="ok",
  "Web is not connected to a healthy read-only backend");
 assert(catalog?.schemaVersion==="operational_market_v1"&&catalog.evidenceStatus==="unreviewed"&&
  Number.isSafeInteger(catalog.total)&&catalog.total>0&&catalog.offset===0&&catalog.limit===25&&
  Array.isArray(catalog.items)&&catalog.items.length>0&&catalog.items.length<=25,
  "Operational catalog is empty or unexpected");
 const first=catalog.items[0]?.ticker;
 assert(typeof first==="string"&&tickerPattern.test(first)&&validDay(catalog.items[0]?.latestDataDate),
  "Invalid first observed ticker/date");
 assert(health.operationalMarket?.status==="available"&&health.operationalMarket.observedTickers===catalog.total,
  "Frontend health does not match live backend operational ticker count");
 const barsResponse=await request(backend+"/api/v1/operational/stocks/"+first+"/ohlcv");
 const bars=await barsResponse.json();
 assert(bars?.ticker===first&&Array.isArray(bars.bars)&&bars.bars.length>0,
  "Actual operational ticker has no OHLCV");
 let lastDate="";
 for(const bar of bars.bars){
  assert(validDay(bar?.date)&&bar.date>lastDate,"Invalid or unordered operational OHLCV dates");
  lastDate=bar.date;
 }
 assert(lastDate===catalog.items[0].latestDataDate,
  "Catalog latest date disagrees with observed OHLCV series");
 const [home,market,detail,diagnostics]=await Promise.all([
  request(web+"/","text/html").then(r=>r.text()),
  request(web+"/operational-market","text/html").then(r=>r.text()),
  request(web+"/operational-market/"+first,"text/html").then(r=>r.text()),
  request(web+"/diagnostics?ticker="+first,"text/html").then(r=>r.text())
 ]);
 assert(home.includes("Collected KRX observations")&&home.includes(first),
  "Home page does not expose actual collected ticker");
 assert(market.includes(first)&&market.includes(String(catalog.total)),
  "Collected market page does not expose backend catalog");
 assert(detail.includes(first)&&detail.includes(lastDate),
  "Ticker detail does not expose actual last OHLCV date");
 assert(diagnostics.includes("Collected KRX data")&&diagnostics.includes(String(catalog.total)),
  "Diagnostics does not show operational total");
 return {total:catalog.total,ticker:first,bars:bars.bars.length,lastDate};
}

const invoked=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(invoked){
 const result=await verifyOperationalWebE2E({
  backend:process.env.DONGHAK_API_BASE_URL,
  web:process.env.MARKET_LENS_URL??"http://127.0.0.1:3000",
  dataSource:process.env.MARKET_LENS_DATA_SOURCE
 });
 console.log("PASS: operational backend and web HTTP integration");
 console.log("Observed tickers:",result.total);
 console.log("First observed ticker:",result.ticker);
 console.log("Original OHLCV bars:",result.bars);
 console.log("Last observed date:",result.lastDate);
 console.log("Confirmed pages: /, /operational-market, /operational-market/"+result.ticker+", /diagnostics?ticker="+result.ticker);
 console.log("Unreviewed operational observations are not research-approved data.");
}
