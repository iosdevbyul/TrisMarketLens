"use client";
import { ClientLocalize } from "../../i18n/LocaleProvider";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function normalizeOperationalTicker(value:string):string|null{
 const cleaned=value.trim().toUpperCase();
 return /^[0-9A-Z]{6}$/.test(cleaned)?cleaned:null;
}
export function OperationalTickerSearch(){
 const router=useRouter();
 const [ticker,setTicker]=useState("");
 const [error,setError]=useState(false);
 return <form className="operational-controls" onSubmit={event=>{
  event.preventDefault();
  const normalized=normalizeOperationalTicker(ticker);
  if(!normalized){setError(true);return;}
  setError(false);
  router.push("/operational-market/"+normalized);
 }} aria-label="Find collected ticker">
  <label htmlFor="operational-ticker"><ClientLocalize text="Open collected ticker" /></label>{" "}
  <input id="operational-ticker" name="ticker" value={ticker} maxLength={6} autoComplete="off" onChange={event=>{setTicker(event.target.value);setError(false);}} placeholder="005930" aria-invalid={error} required/>{" "}
  <button type="submit"><ClientLocalize text="View OHLCV" /></button>
  {error?<p role="alert" className="metric-detail"><ClientLocalize text="Enter exactly six letters or digits." /></p>:null}
  <p className="metric-detail"><ClientLocalize text="Direct lookup uses the configured snapshot. An unknown ticker returns a clear error, not a demo price." /></p>
 </form>;
}
