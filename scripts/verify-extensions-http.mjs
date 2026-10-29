// Live read-only HTTP smoke verification. Requires a running backend and an explicitly chosen ticker.
// This script never executes model inference, collection, backtesting, trading or repairs.
const base=(process.env.DONGHAK_API_BASE_URL??"").trim().replace(/\/+$/,"");
if(process.env.MARKET_LENS_DATA_SOURCE!=="http")throw Error("MARKET_LENS_DATA_SOURCE must be http for real-data verification");
const ticker=(process.env.MARKET_LENS_VERIFY_TICKER??"").trim();
if(!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) throw Error("Only an explicit loopback DONGHAK_API_BASE_URL is permitted");
if(!/^[0-9A-Z]{6}$/.test(ticker)) throw Error("MARKET_LENS_VERIFY_TICKER must be a six-character ticker");
async function read(path){
 const response=await fetch(base+path,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
 if(!response.ok) throw Error(path+" returned HTTP "+response.status);
 return response.json();
}
function check(ok,message){if(!ok)throw Error(message);}
const health=await read("/api/v1/health");
check(health?.status==="ok"&&health?.mode==="read_only","Backend must be read-only and healthy");
const [runs,freshness,alerts,screener,ohlcv,analysis]=await Promise.all([
 read("/api/v1/operations/runs?offset=0&limit=25"),
 read("/api/v1/operations/freshness"),
 read("/api/v1/operations/alerts?offset=0&limit=25"),
 read("/api/v1/analysis/screener"),
 read("/api/v1/stocks/"+ticker+"/ohlcv"),
 read("/api/v1/stocks/"+ticker+"/analysis"),
]);
for(const [name,payload] of [["runs",runs],["freshness",freshness],["alerts",alerts]]){
 check(payload?.schemaVersion==="operations_v1"&&Array.isArray(payload.items),name+" contract mismatch");
}
for(const [name,payload] of [["runs",runs],["alerts",alerts]]){
 check(payload.offset===0&&payload.limit===25&&Number.isInteger(payload.total)&&payload.total>=payload.items.length,name+" pagination mismatch");
}
check(Array.isArray(screener?.entries),"Screener response shape invalid");
check(screener.entries.every(e=>e&&typeof e.ticker==="string"&&["verified","pending","blocked"].includes(e.validation)),"Screener record contract mismatch");
check(screener.entries.every(e=>e.score===null||e.validation==="verified"),"Unreviewed numeric screener score");
check(ohlcv?.ticker===ticker&&Array.isArray(ohlcv.bars)&&ohlcv.bars.length<=2500,"OHLCV contract mismatch");
let previous="";
for(const bar of ohlcv.bars){
 check(typeof bar.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(bar.date)&&bar.date>previous&&new Date(bar.date+"T00:00:00Z").toISOString().slice(0,10)===bar.date,"OHLCV trading date contract mismatch");
 previous=bar.date;
 check(["open","high","low","close","volume"].every(key=>Number.isSafeInteger(bar[key])&&bar[key]>=0),"OHLCV values must be nonnegative integers");
 const noTrade=bar.open===0&&bar.high===0&&bar.low===0&&bar.close>0&&bar.volume===0;
 check(noTrade||(bar.open>0&&bar.close>0&&bar.low>0&&bar.high>=Math.max(bar.open,bar.close,bar.low)&&bar.low<=Math.min(bar.open,bar.close)),"OHLCV price range contract mismatch");
}
check(analysis?.ticker===ticker&&Array.isArray(analysis.records)&&analysis.records.length<=500,"Stock analysis contract mismatch");
check(analysis.records.every(e=>e&&e.ticker===ticker&&typeof e.id==="string"&&["verified","blocked","pending"].includes(e.validation)),"Stock analysis record contract mismatch");
check(analysis.records.every(e=>e.score===null||e.validation==="verified"),"Unreviewed numeric stock score");
console.log("Extended read-only HTTP smoke verification passed.");
console.log("Selected ticker:",ticker);
console.log("Operations runs returned:",runs.items.length,"of",runs.total);
console.log("Freshness sources:",freshness.items.length);
console.log("Alerts returned:",alerts.items.length,"of",alerts.total);
console.log("Screener entries:",screener.entries.length);
console.log("Original OHLCV bars:",ohlcv.bars.length);
console.log("Published stock analyses:",analysis.records.length);
console.log("Note: HTTP contract checks do not establish data freshness, completeness or research approval.");
