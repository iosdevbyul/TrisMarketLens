import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {getDataSource} from "@/data/getDataSource";
import {getScreener} from "@/data/ScreenerDataSource";
import {getStockAnalysis} from "@/data/StockAnalysisDataSource";
import {getFeatureDataState} from "@/domain/featureDataState";
import {evidenceForTicker,selectedResearchModel,validResearchTicker} from "@/domain/researchWorkbench";
import type {CoverageSummary,ModelSummary,EvidenceLayerSummary,ModelDetail} from "@/domain/research";

function errorDetail(error:unknown):string{
 return error instanceof Error?error.message:"Research backend is unavailable.";
}
export default async function ResearchWorkbenchPage({
 searchParams
}:{searchParams:Promise<{direction?:string;ticker?:string}>}){
 const query=await searchParams;
 const direction=selectedResearchModel(query.direction??"up");
 const ticker=(query.ticker??"").trim().toUpperCase();
 const validTicker=ticker===""||validResearchTicker(ticker);
 const source=getDataSource();
 const [modelsResult,coverageResult,evidenceResult,screenerResult,modelResult,stockResult]=await Promise.allSettled([
  source.getModelSummaries(),
  source.getCoverageSummary(),
  source.getEvidenceLayers(),
  getScreener(),
  direction?source.getModel(direction):Promise.resolve(null),
  validTicker&&ticker?getStockAnalysis(ticker):Promise.resolve(null)
 ]);
 const models:ModelSummary[]=modelsResult.status==="fulfilled"?modelsResult.value:[];
 const coverage:CoverageSummary|null=coverageResult.status==="fulfilled"?coverageResult.value:null;
 const layers:EvidenceLayerSummary[]=evidenceResult.status==="fulfilled"?evidenceResult.value:[];
 const screener=screenerResult.status==="fulfilled"?screenerResult.value:null;
 const selected:ModelDetail|null=modelResult.status==="fulfilled"?modelResult.value:null;
 const stock=stockResult.status==="fulfilled"?stockResult.value:null;
 const mode=process.env.MARKET_LENS_DATA_SOURCE??"mock";
 const state=screener?getFeatureDataState(screener.source,screener.error,screener.data.entries.length):"error";
 const recordEvidence=validTicker&&ticker&&stock&&screener?
  evidenceForTicker(screener.data.entries,ticker,stock.data.records):null;
 const errors=[
  modelsResult.status==="rejected"?"Model catalog: "+errorDetail(modelsResult.reason):null,
  coverageResult.status==="rejected"?"Research coverage: "+errorDetail(coverageResult.reason):null,
  evidenceResult.status==="rejected"?"Evidence layers: "+errorDetail(evidenceResult.reason):null,
  screenerResult.status==="rejected"?"Published screener: "+errorDetail(screenerResult.reason):screener?.error,
  modelResult.status==="rejected"?"Selected model: "+errorDetail(modelResult.reason):null,
  stockResult.status==="rejected"?"Ticker analysis: "+errorDetail(stockResult.reason):stock?.error
 ].filter((item):item is string=>Boolean(item));
 const entries=recordEvidence?.entries??[];
 const records=recordEvidence?.records??[];
 return <>
  <Link className="back-link" href="/models">← Back to model catalog</Link>
  <PageHeader eyebrow="AI research" title="Research evidence workbench"
   badge={mode==="mock"?"Demonstration":errors.length?"Partial evidence":"Read-only research"}
   description="Follow published model qualification, evidence blockers and explicitly published security analysis. Global Up/Down model statistics do not identify a ticker's inference model or constitute investment advice."/>
  <section className="panel single-panel" aria-label="Source and research status">
   <div className="panel-heading"><h2>Research publication readiness</h2><span className="panel-count">{state}</span></div>
   <p className="section-copy">Data source: {mode}. {mode==="mock"?"All demonstration model and signal records are fictional and must not be mistaken for actual predictions.":"Only explicitly published backend snapshots are shown. Missing publications are never replaced by demo predictions."}</p>
   {errors.map((message,index)=><p className="metric-detail" role="alert" key={index}>{message}</p>)}
   <div className="operations-overview-grid">
    <div className="operations-overview-stat"><span>Model directions</span><strong>{modelsResult.status==="fulfilled"?models.length:"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Evidence layers</span><strong>{evidenceResult.status==="fulfilled"?layers.length:"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Market universe</span><strong>{coverage?.universe??"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Historical identities verified</span><strong>{coverage?coverage.historicalIdentityVerified+"/"+coverage.universe:"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Unresolved securities</span><strong>{coverage?.unresolvedSecurities??"Unavailable"}</strong></div>
    <div className="operations-overview-stat"><span>Published screener records</span><strong>{screener?screener.data.entries.length:"Unavailable"}</strong></div>
   </div>
   <p className="metric-detail">Transport health and published model validation do not imply complete ticker identity, prediction evaluation, current market data or trade readiness.</p>
  </section>
  <section className="panel single-panel" aria-label="Choose model qualification and security">
   <div className="panel-heading"><h2>Explore evidence</h2><span className="panel-count">Read-only</span></div>
   <form action="/research-workbench" method="get">
    <label htmlFor="workbench-direction">Qualified direction</label>{" "}
    <select id="workbench-direction" name="direction" defaultValue={direction??"up"}>
     <option value="up">Up</option><option value="down">Down</option>
    </select>{" "}
    <label htmlFor="workbench-ticker">Security ticker</label>{" "}
    <input id="workbench-ticker" name="ticker" maxLength={6} defaultValue={ticker} pattern="[0-9A-Za-z]{6}" placeholder="005930"/>{" "}
    <button type="submit">Review evidence</button>
   </form>
   {!direction?<p role="alert">Invalid model direction; choose Up or Down.</p>:null}
   {!validTicker?<p role="alert">Ticker must have six letters or digits.</p>:null}
   <p className="section-copy">Direction selects a qualified global research model for inspection; the ticker separately selects recorded security publications. Their model identities are not assumed to match.</p>
  </section>
  <section className="panel single-panel" aria-label="Frozen model qualification">
   <div className="panel-heading"><h2>Frozen global model evidence</h2><span className="panel-count">{selected?.role??"Unavailable"}</span></div>
   {models.map(model=><p key={model.id} className="metric-detail"><Link href={"/research-workbench?direction="+model.id+(ticker?"&ticker="+encodeURIComponent(ticker):"")}>{model.direction}: {model.modelName}</Link> · Validation AP {model.validationAveragePrecision.toFixed(6)} · Frozen OOS AP {model.oosAveragePrecision.toFixed(6)} · {model.role}</p>)}
   {selected?<div className="operations-overview-grid">
    <div className="operations-overview-stat"><span>Selected model</span><strong>{selected.modelName}</strong></div>
    <div className="operations-overview-stat"><span>Validation samples</span><strong>{selected.validation.sampleCount}</strong></div>
    <div className="operations-overview-stat"><span>Frozen OOS samples</span><strong>{selected.oos.sampleCount}</strong></div>
    <div className="operations-overview-stat"><span>Artifact fingerprint</span><strong><code>{selected.provenance.artifactSha256.slice(0,14)}…</code></strong></div>
   </div>:<p className="metric-detail">No qualified model detail is available for this direction.</p>}
   {selected&&direction?<p><Link href={"/models/"+direction}>Inspect source metrics and complete model provenance</Link></p>:null}
  </section>
  <section className="panel single-panel" aria-label="Research evidence blockers">
   <div className="panel-heading"><h2>Research data and lifecycle evidence</h2><span className="panel-count">{layers.length} layers</span></div>
   {layers.length===0?<p className="metric-detail">No evidence layers available.</p>:null}
   {layers.map(layer=><article className="operations-run" key={layer.id}>
    <div><strong><Link href={"/evidence/"+layer.id}>{layer.title}</Link></strong><p className="metric-detail">{layer.summary}</p><p className="metric-detail">Source: {layer.sourceLabel}</p></div>
    <span className="status-pill" data-state={layer.state}>{layer.state}</span>
   </article>)}
   {coverage?<p className="section-copy">Unexplained ticker sessions: {coverage.unexplainedTickerSessions}. This workbench does not waive unresolved securities or missing evidence.</p>:null}
  </section>
  <section className="panel single-panel" aria-label="Per-security published analysis">
   <div className="panel-heading"><h2>Published security analysis</h2><span className="panel-count">{ticker||"No ticker selected"}</span></div>
   {ticker&&!validTicker?<p role="alert">Invalid ticker.</p>:null}
   {!ticker?<p className="section-copy">Enter a ticker to inspect recorded security analysis against the published screener.</p>:null}
   {ticker&&validTicker?<p className="section-copy">Screener records: {entries.length} · Per-ticker records: {records.length}. Exact published record correspondence: {recordEvidence?.matched?"Found":"Not confirmed"}. A score is displayed only when the backend verifies the individual record; this does not certify investment suitability.</p>:null}
   {stock?.source==="mock"||screener?.source==="mock"?<p role="status" className="metric-detail">Fictional demonstration analysis — not market observations.</p>:null}
   {ticker&&validTicker&&entries.length===0&&records.length===0?<p className="metric-detail">No published research analysis for this ticker; this is not a neutral model prediction.</p>:null}
   {records.map(item=><article className="operations-run" key={item.id}>
    <div>
     <strong>{item.modelId} · {item.modelVersion}</strong>
     <p className="metric-detail">Record ID: {item.id} · Direction: {item.direction} · Validation: {item.validation}</p>
     <p className="metric-detail">Data through: {item.dataThrough} · Published at: {item.analyzedAt}</p>
     <p className="metric-detail">Recorded score: {item.score===null?"Unavailable":item.score.toFixed(4)}</p>
     {item.explanation?<p className="metric-detail">{item.explanation}</p>:null}
    </div><span className="status-pill" data-state={item.validation==="verified"?"verified":"blocked"}>{item.validation}</span>
   </article>)}
   {entries.length>0&&records.length===0?<p className="metric-detail">Published screener entries exist but per-ticker analysis is absent or inaccessible. They are not substituted for a ticker publication.</p>:null}
   {ticker&&validTicker?<p><Link href={"/stocks/"+ticker}>View ticker history, evaluation and source metadata</Link></p>:null}
   <p><Link href="/screener">Browse all published screener records</Link></p>
  </section>
 </>;
}
