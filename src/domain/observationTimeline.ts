import type {OhlcvBar} from "./ohlcv";

export interface ObservationMonth {
 month:string;
 observed:number;
 noTrade:number;
 firstDate:string;
 lastDate:string;
}
export function groupObservationMonths(bars:readonly OhlcvBar[]):ObservationMonth[]{
 const map=new Map<string,ObservationMonth>();
 for(const bar of bars){
  const month=bar.date.slice(0,7);
  const existing=map.get(month);
  const noTrade=bar.open===0&&bar.high===0&&bar.low===0&&bar.volume===0?1:0;
  if(existing){existing.observed++;existing.noTrade+=noTrade;existing.lastDate=bar.date;}
  else map.set(month,{month,observed:1,noTrade,firstDate:bar.date,lastDate:bar.date});
 }
 return [...map.values()];
}
