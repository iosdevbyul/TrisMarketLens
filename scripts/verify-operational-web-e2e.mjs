// Compare the live read-only operational API with the running TrisMarketLens pages.
const backend=(process.env.DONGHAK_API_BASE_URL??"").trim().replace(/\/+$/,"");
const web=(process.env.MARKET_LENS_URL??"http://127.0.0.1:3000").trim().replace(/\/+$/,"");
const loopback=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
if(process.env.MARKET_LENS_DATA_SOURCE!=="http")throw Error("MARKET_LENS_DATA_SOURCE must be http");
if(!loopback.test(backend)||!loopback.test(web))throw Error("Both URLs must point to explicit loopback HTTP services");
function assert(condition,message){if(!condition)throw Error(message);}
async function request(url,accept="application/json"){
 const result=await fetch(url,{headers:{Accept:accept},cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!result.ok)throw Error(url+" returned HTTP "+result.status);
 return result;
}
const [healthResponse,catalogResponse]=await Promise.all([
 request(web+"/api/health"),
 request(backend+"/api/v1/operational/stocks?offset=0&limit=25"),
]);
const health=await healthResponse.json(),catalog=await catalogResponse.json();
assert(health.status==="ok"&&health.dataSource==="http"&&health.backend?.status==="ok","Web is not connected to a healthy read-only backend");
assert(catalog.schemaVersion==="operational_market_v1"&&catalog.evidenceStatus==="unreviewed"&&
 Number.isSafeInteger(catalog.total)&&catalog.total>0&&Array.isArray(catalog.items)&&catalog.items.length>0,"Operational catalog is empty or unexpected");
assert(health.operationalMarket?.status==="available"&&health.operationalMarket.observedTickers===catalog.total,
 "Frontend health does not match live backend operational ticker count");
const first=catalog.items[0].ticker;
assert(/^[0-9A-Z]{6}$/.test(first),"Invalid first observed ticker");
const barsResponse=await request(backend+"/api/v1/operational/stocks/"+first+"/ohlcv");
const bars=await barsResponse.json();
assert(bars.ticker===first&&Array.isArray(bars.bars)&&bars.bars.length>0,"Actual operational ticker has no OHLCV");
const [home,market,detail,diagnostics]=await Promise.all([
 request(web+"/","text/html").then(r=>r.text()),
 request(web+"/operational-market","text/html").then(r=>r.text()),
 request(web+"/operational-market/"+first,"text/html").then(r=>r.text()),
 request(web+"/diagnostics?ticker="+first,"text/html").then(r=>r.text()),
]);
assert(home.includes("Collected KRX observations")&&home.includes(first),"Home page does not expose actual collected ticker");
assert(market.includes(first)&&market.includes(String(catalog.total)),"Collected market page does not expose backend catalog");
assert(detail.includes(first)&&detail.includes(bars.bars.at(-1).date),"Ticker detail does not expose actual last OHLCV date");
assert(diagnostics.includes("Collected KRX data")&&diagnostics.includes(String(catalog.total)),"Diagnostics does not show operational total");
console.log("PASS: operational backend and web HTTP integration");
console.log("Observed tickers:",catalog.total);
console.log("First observed ticker:",first);
console.log("Original OHLCV bars:",bars.bars.length);
console.log("Last observed date:",bars.bars.at(-1).date);
console.log("Confirmed pages: /, /operational-market, /operational-market/"+first+", /diagnostics?ticker="+first);
console.log("Unreviewed operational observations are not research-approved data.");
