import type {OhlcvBar} from "./ohlcv";

export type ChartPeriod="1M"|"3M"|"6M"|"1Y";
const months:Record<ChartPeriod,number>={"1M":1,"3M":3,"6M":6,"1Y":12};

/** Subtract UTC calendar months, clamping 29–31st to target month's last day. */
export function chartPeriodStart(lastDay:string,period:ChartPeriod):string{
 const date=new Date(lastDay+"T00:00:00Z");
 const shift=months[period];
 const targetMonth=date.getUTCMonth()-shift;
 const first=new Date(Date.UTC(date.getUTCFullYear(),targetMonth,1));
 const last=new Date(Date.UTC(date.getUTCFullYear(),targetMonth+1,0)).getUTCDate();
 first.setUTCDate(Math.min(date.getUTCDate(),last));
 return first.toISOString().slice(0,10);
}
export function filterOhlcvPeriod(bars:readonly OhlcvBar[],period:ChartPeriod):OhlcvBar[]{
 if(!bars.length)return [];
 const start=chartPeriodStart(bars[bars.length-1].date,period);
 return bars.filter(bar=>bar.date>=start);
}
export function chartAnalysesForSource(
 priceSource:"http"|"mock"|"disconnected",analysisSource:"http"|"mock"|"disconnected",
 analysisError:string|null
):boolean{
 // A mock analysis must never become a "signal" on a real observed price chart.
 return !analysisError&&priceSource===analysisSource&&(priceSource==="http"||priceSource==="mock");
}
