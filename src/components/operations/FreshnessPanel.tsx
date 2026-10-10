import type {FreshnessResult} from "@/data/FreshnessDataSource";
import {translate,type Locale} from "@/i18n/translations";
export function FreshnessPanel({result,locale}:{result:FreshnessResult;locale:Locale}){
 const t=(s:string)=>translate(locale,s);
 const report=result.report;
 const status=report?.state==="current"?"Current":report?.state==="delayed"?"Delayed":"Unknown";
 return <section className="panel single-panel freshness-panel" aria-label={t("Data freshness")}>
  <div className="panel-heading"><div><p className="eyebrow">{t("Exchange calendar")}</p><h2>{t("Data freshness")}</h2></div><span className="panel-count">{t(status)}</span></div>
  {result.source==="mock"?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("Calendar dates and freshness status are fictional demo data.")}</span></div>:null}
  {result.error?<div className="run-lock" role="alert"><p>{t("Freshness unavailable")}</p><span>{result.error}</span></div>:null}
  {!report?<p className="section-copy">{t("No verified exchange calendar assessment is available.")}</p>:null}
  <dl className="freshness-grid">
   {[[t("Calendar source"),report?.calendarId??"—"],[t("Expected completed session"),report?.expectedSession??"—"],[t("Validated data through"),report?.validatedThrough??"—"],[t("Assessed at"),report?.assessedAt??"—"]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
  </dl>
  {report?.reason?<p className="section-copy">{report.reason}</p>:null}
  <p className="metric-detail">{t("Trading holidays and completion cutoffs are defined by the backend, never inferred from weekdays in the web app.")}</p>
 </section>;
}
