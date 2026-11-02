import type {AnalysisRun} from "./operations";
export function recordedRunDuration(run:Pick<AnalysisRun,"startedAt"|"finishedAt">):string|null{
 if(!run.startedAt||!run.finishedAt)return null;
 const start=Date.parse(run.startedAt),end=Date.parse(run.finishedAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
 const seconds=Math.floor((end-start)/1000);
 const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),remainder=seconds%60;
 return hours?hours+"h "+minutes+"m "+remainder+"s":minutes?minutes+"m "+remainder+"s":remainder+"s";
}
