"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {translate,type Locale} from "@/i18n/translations";
import {filterScreener,type ScreenerEntry,type ScreenerFilters} from "@/domain/screener";
export function ScreenerExplorer({entries,locale}:{entries:ScreenerEntry[];locale:Locale}){
 const [query,setQuery]=useState("");
 const [direction,setDirection]=useState("all");
 const [validation,setValidation]=useState("all");
 const [sort,setSort]=useState<ScreenerFilters["sort"]>("score");
 const results=useMemo(()=>filterScreener(entries,{query,direction,validation,sort}),[entries,query,direction,validation,sort]);
 const t=(s:string)=>translate(locale,s);
 return <div className="screener-explorer">
  <div className="screener-controls">
   <label>{t("Search ticker, name or model")}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search analyses")}/></label>
   <label>{t("Direction")}<select value={direction} onChange={e=>setDirection(e.target.value)}><option value="all">{t("All directions")}</option><option value="up">{t("Up")}</option><option value="down">{t("Down")}</option><option value="neutral">{t("Neutral")}</option></select></label>
   <label>{t("Validation")}<select value={validation} onChange={e=>setValidation(e.target.value)}><option value="all">{t("All states")}</option><option value="verified">{t("Verified")}</option><option value="pending">{t("Pending")}</option><option value="blocked">{t("Blocked")}</option></select></label>
   <label>{t("Sort by")}<select value={sort} onChange={e=>setSort(e.target.value as ScreenerFilters["sort"])}><option value="score">{t("Model score")}</option><option value="date">{t("Latest analysis")}</option><option value="ticker">{t("Ticker")}</option></select></label>
  </div>
  <p className="metric-detail">{results.length} {t("matching analyses")}</p>
  {results.length===0?<p className="section-copy">{t("No analyses match your filters.")}</p>:
  <div className="screener-table-wrap"><table className="screener-table"><thead><tr>{["Ticker","Model","Direction","Model score","Validation","Data through"].map(k=><th key={k}>{t(k)}</th>)}</tr></thead><tbody>{results.map(r=><tr key={r.ticker+":"+r.analysisId}><td><Link href={"/stocks/"+encodeURIComponent(r.ticker)}>{r.ticker}</Link><span>{r.name??""}</span></td><td>{r.modelId}<span>{r.modelVersion}</span></td><td>{t(r.direction==="up"?"Up":r.direction==="down"?"Down":"Neutral")}</td><td>{r.score===null?"—":r.score.toFixed(4)}</td><td>{t(r.validation==="verified"?"Verified":r.validation==="pending"?"Pending":"Blocked")}</td><td>{r.dataThrough}</td></tr>)}</tbody></table></div>}
 </div>
}
