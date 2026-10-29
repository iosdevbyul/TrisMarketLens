import { getFeatureDataState } from "@/domain/featureDataState";
import {PageHeader} from "@/components/common/PageHeader";
import {WakPanel} from "@/components/design-system/WakPanel";
import {getLocale,getTranslator} from "@/i18n/server";
import {getScreener} from "@/data/ScreenerDataSource";
import {ScreenerExplorer} from "@/components/screener/ScreenerExplorer";
export default async function ScreenerPage(){
 const [t,locale,result]=await Promise.all([getTranslator(),getLocale(),getScreener()]);
 const state=getFeatureDataState(result.source,result.error,result.data.entries.length);
 return <><PageHeader eyebrow={t("AI research")} title={t("AI Screener")} badge={t(state==="demo"?"Demo data":state==="available"?"API data":state==="error"?"Screener unavailable":state==="empty"?"No analysis runs available":"Not connected")} description={t("Explore model analyses across securities. Scores are not investment recommendations.")}/>
 {result.source==="mock"?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("All screener records are fictional examples, not market predictions.")}</span></div>:null}
 {result.error?<div className="run-lock" role="alert"><p>{t("Screener unavailable")}</p><span>{result.error}</span></div>:null}
 {state==="disconnected"?<p className="section-copy">{t("Not connected")}</p>:null}
 {state==="empty"?<p className="section-copy">{t("No verified model analysis is available for this ticker.")}</p>:null}
 <WakPanel as="section" className="single-panel"><ScreenerExplorer entries={result.data.entries} locale={locale}/></WakPanel></>;
}
