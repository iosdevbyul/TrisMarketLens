import {PageHeader} from "@/components/common/PageHeader";
import {WakPanel} from "@/components/design-system/WakPanel";
import {getLocale,getTranslator} from "@/i18n/server";
import {getScreener} from "@/data/ScreenerDataSource";
import {ScreenerExplorer} from "@/components/screener/ScreenerExplorer";
export default async function ScreenerPage(){
 const [t,locale,result]=await Promise.all([getTranslator(),getLocale(),getScreener()]);
 return <><PageHeader eyebrow={t("AI research")} title={t("AI Screener")} badge={result.source==="mock"?t("Demo data"):result.source==="http"?t("API data"):t("Not connected")} description={t("Explore model analyses across securities. Scores are not investment recommendations.")}/>
 {result.source==="mock"?<div className="run-lock" role="status"><p>{t("Demonstration mode")}</p><span>{t("All screener records are fictional examples, not market predictions.")}</span></div>:null}
 {result.error?<div className="run-lock" role="alert"><p>{t("Screener unavailable")}</p><span>{result.error}</span></div>:null}
 <WakPanel as="section" className="single-panel"><ScreenerExplorer entries={result.data.entries} locale={locale}/></WakPanel></>;
}
