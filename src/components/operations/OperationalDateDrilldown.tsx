"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {DateDistribution} from "@/data/OperationalDateDistributionDataSource";

export function OperationalDateDrilldown({distribution}:{distribution:DateDistribution}){
 const [selected,setSelected]=useState(distribution.tickersByDate[0]?.date??"");
 const [query,setQuery]=useState("");
 const tickers=useMemo(()=>distribution.tickersByDate.find(group=>group.date===selected)?.tickers??[],[distribution,selected]);
 const filtered=tickers.filter(ticker=>ticker.includes(query.trim().toUpperCase()));
 return <div className="operational-date-drilldown">
  <div className="operational-controls">
   <label htmlFor="observed-date-filter">Latest collected date
    <select id="observed-date-filter" value={selected} onChange={event=>{setSelected(event.target.value);setQuery("");}}>
     {distribution.tickersByDate.map(group=><option value={group.date} key={group.date}>{group.date} ({group.tickers.length})</option>)}
    </select>
   </label>
   <label htmlFor="observed-ticker-filter">Filter ticker within selected date
    <input id="observed-ticker-filter" value={query} maxLength={6} placeholder="005930" onChange={event=>setQuery(event.target.value)} />
   </label>
  </div>
  <p className="metric-detail" role="status">{filtered.length} of {tickers.length} tickers with latest collected date {selected||"—"}. These are operational observations only.</p>
  {filtered.length===0?<p className="section-copy">No matching observed tickers.</p>:<div className="operational-date-tickers" aria-label="Tickers last observed on selected date">{filtered.map(ticker=><Link href={"/operational-market/"+ticker} key={ticker}>{ticker}</Link>)}</div>}
 </div>;
}
