import type {OhlcvBar} from "@/domain/ohlcv";

export function operationalOhlcvCsv(ticker:string,bars:readonly OhlcvBar[]):string {
 if(!/^[0-9A-Z]{6}$/.test(ticker))throw new Error("Invalid ticker");
 const rows=["date,open,high,low,close,volume"];
 let previous="";
 for(const bar of bars){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(bar.date)||bar.date<=previous||
     ![bar.open,bar.high,bar.low,bar.close,bar.volume].every(v=>Number.isSafeInteger(v)&&v>=0))
   throw new Error("Invalid OHLCV data");
  rows.push([bar.date,bar.open,bar.high,bar.low,bar.close,bar.volume].join(","));
  previous=bar.date;
 }
 return rows.join("\r\n")+"\r\n";
}
