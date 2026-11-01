// Export only tickers visible in the selected operational date filter.
export function operationalDateTickersCsv(date:string,tickers:string[]):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z"))||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)throw Error("Invalid observation date");
 if(tickers.some(ticker=>! /^[0-9A-Z]{6}$/.test(ticker)))throw Error("Invalid operational ticker");
 return ["ticker,latestDataDate,evidenceStatus",...tickers.map(ticker=>ticker+","+date+",unreviewed")].join("\r\n")+"\r\n";
}
