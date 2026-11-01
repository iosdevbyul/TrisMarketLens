import type {OhlcvBar} from "./ohlcv";

export interface ObservationCoverage {
 firstDate:string;
 lastDate:string;
 observedDates:number;
 noTradeDates:number;
 calendarDays:number;
}
export function summarizeObservationCoverage(bars:readonly OhlcvBar[]):ObservationCoverage|null{
 if(!bars.length)return null;
 const firstDate=bars[0].date,lastDate=bars[bars.length-1].date;
 const calendarDays=Math.round((Date.parse(lastDate+"T00:00:00Z")-Date.parse(firstDate+"T00:00:00Z"))/86400000)+1;
 return {
  firstDate,lastDate,observedDates:bars.length,calendarDays,
  noTradeDates:bars.filter(b=>b.open===0&&b.high===0&&b.low===0&&b.volume===0).length
 };
}
