// Read-only local-backend verification for the actual collected KRX operational snapshot.
// No collection, provider requests, database writes, inference or trades.
const base=(process.env.DONGHAK_API_BASE_URL??"").trim().replace(/\/+$/,"");
if(process.env.MARKET_LENS_DATA_SOURCE!=="http")throw Error("Set MARKET_LENS_DATA_SOURCE=http");
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base))throw Error("Use an explicit local HTTP backend (127.0.0.1 or localhost)");
const selected=(process.env.MARKET_LENS_VERIFY_TICKER??"").trim().toUpperCase();
if(selected&&!/^[0-9A-Z]{6}$/.test(selected))throw Error("Invalid MARKET_LENS_VERIFY_TICKER");

function assert(ok,message){if(!ok)throw Error(message);}
async function get(path){
 const response=await fetch(base+path,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error(path+" returned HTTP "+response.status);
 return response.json();
}
const health=await get("/api/v1/health");
assert(health?.status==="ok"&&health?.mode==="read_only","Backend is not healthy and read-only");
let offset=0,total=null,latest=null;
const tickers=new Set();
let first=null;
do{
 const data=await get("/api/v1/operational/stocks?offset="+offset+"&limit=25");
 assert(data?.schemaVersion==="operational_market_v1"&&data.evidenceStatus==="unreviewed"&&
  Number.isSafeInteger(data.total)&&data.total>=0&&data.offset===offset&&data.limit===25&&
  Array.isArray(data.items)&&data.items.length<=25,"Operational catalog payload mismatch");
 if(total===null)total=data.total;
 assert(total===data.total,"Operational catalog changed during pagination; use a pinned immutable snapshot");
 assert(data.items.length>0||offset>=total,"Missing catalog page results");
 for(const item of data.items){
  assert(item&&/^[0-9A-Z]{6}$/.test(item.ticker)&&/^\d{4}-\d{2}-\d{2}$/.test(item.latestDataDate)&&
   new Date(item.latestDataDate+"T00:00:00Z").toISOString().slice(0,10)===item.latestDataDate,
   "Invalid catalog ticker/date");
  assert(!tickers.has(item.ticker),"Duplicate catalog ticker");
  if(first!==null)assert(item.ticker>first,"Catalog order mismatch");
  first=item.ticker;
  tickers.add(item.ticker);
  if(latest===null||item.latestDataDate>latest)latest=item.latestDataDate;
 }
 offset+=data.items.length;
 assert(offset<=total,"Catalog exceeded reported total");
}while(offset<total);
assert(total>0,"No collected tickers in configured snapshot");
assert(tickers.size===total,"Incomplete operational catalog");
const ticker=selected||tickers.values().next().value;
assert(tickers.has(ticker),"Selected ticker not present in operational catalog");
const series=await get("/api/v1/operational/stocks/"+ticker+"/ohlcv");
assert(series?.ticker===ticker&&Array.isArray(series.bars)&&series.bars.length>0&&series.bars.length<=2500,
 "Operational OHLCV payload missing or mismatched");
let last="";
for(const b of series.bars){
 assert(typeof b.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(b.date)&&b.date>last&&
  new Date(b.date+"T00:00:00Z").toISOString().slice(0,10)===b.date,"Invalid OHLCV date/order");
 last=b.date;
 assert(["open","high","low","close","volume"].every(k=>Number.isSafeInteger(b[k])&&b[k]>=0),"Invalid OHLCV values");
 const noTrade=b.open===0&&b.high===0&&b.low===0&&b.close>0&&b.volume===0;
 assert(noTrade||(b.open>0&&b.close>0&&b.low>0&&b.high>=Math.max(b.open,b.close,b.low)&&b.low<=Math.min(b.open,b.close)),"Invalid OHLCV price range");
}
console.log("PASS: read-only operational HTTP contract and snapshot observations");
console.log("Observed tickers:",total);
console.log("Latest recorded trading date:",latest);
console.log("Checked ticker:",ticker);
console.log("Collected OHLCV bars:",series.bars.length);
console.log("Note: These observations are unreviewed and do not certify market completeness, provenance or research eligibility.");
