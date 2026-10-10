import Link from "next/link";
import { summarizeAnalyses } from "@/domain/analysisOverview";
import type { ScreenerResult } from "@/data/ScreenerDataSource";
import { translate, type Locale } from "@/i18n/translations";

export function AnalysisOverviewPanel({result,locale}:{result:ScreenerResult;locale:Locale}) {
  const t=(value:string)=>translate(locale,value);
  const summary=summarizeAnalyses(result.data.entries);
  const connected=result.source!=="disconnected" && !result.error;
  const total=summary.analysisCount;
  const distribution=[
    {label:"Up",value:summary.direction.up,kind:"up"},
    {label:"Down",value:summary.direction.down,kind:"down"},
    {label:"Neutral",value:summary.direction.neutral,kind:"neutral"},
  ];
  return <section className="panel single-panel analysis-overview" aria-label={t("AI analysis overview")}>
    <div className="panel-heading">
      <div><p className="eyebrow">{t("AI research")}</p><h2>{t("AI analysis overview")}</h2></div>
      <Link href="/screener" className="analysis-overview-link">{t("Open AI Screener")} →</Link>
    </div>
    {result.source==="mock"?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("This summary uses fictional model records, not live market signals.")}</span></div>:null}
    {result.error?<div className="run-lock" role="alert"><p>{t("Screener unavailable")}</p><span>{result.error}</span></div>:null}
    {!connected?<p className="section-copy">{t("Connect the analysis data source to populate this dashboard.")}</p>:null}
    <div className="analysis-overview-metrics">
      {[
        ["Analyzed securities",connected?summary.securityCount.toLocaleString():"—"],
        ["Analysis records",connected?total.toLocaleString():"—"],
        ["Verified rate",summary.verifiedRate===null||!connected?"—":(summary.verifiedRate*100).toFixed(1)+"%"],
        ["Latest data through",connected?summary.latestDataThrough??"—":"—"],
      ].map(([label,value])=><div className="analysis-overview-metric" key={label}><span>{t(label)}</span><strong>{value}</strong></div>)}
    </div>
    <div className="analysis-overview-details">
      <div>
        <h3>{t("Prediction direction")}</h3>
        {distribution.map(item=><div className="analysis-overview-row" key={item.kind}>
          <span>{t(item.label)}</span>
          <div className="analysis-overview-track"><span className={"analysis-overview-fill "+item.kind} style={{width:total&&connected?`${item.value/total*100}%`:"0%"}}/></div>
          <strong>{connected?item.value:"—"}</strong>
        </div>)}
      </div>
      <div>
        <h3>{t("Validation status")}</h3>
        {([["Verified",summary.validation.verified],["Pending",summary.validation.pending],["Blocked",summary.validation.blocked]] as const).map(([label,count])=><div className="analysis-overview-status" key={label}><span>{t(label)}</span><strong>{connected?count:"—"}</strong></div>)}
        <div className="analysis-overview-status"><span>{t("Latest analysis time")}</span><strong>{connected?summary.latestAnalyzedAt??"—":"—"}</strong></div>
      </div>
    </div>
  </section>;
}
