import Link from "next/link";
import {PageHeader} from "@/components/common/PageHeader";
import {getDataSource} from "@/data/getDataSource";
import {getScreener} from "@/data/ScreenerDataSource";
import {getOperations} from "@/data/OperationsDataSource";
import {loadOperationalCatalog} from "@/data/OperationalMarketDataSource";
import {loadPublishedPortfolios} from "@/data/HistoricalPortfolioDataSource";
import {buildResearchPath,researchPathTicker} from "@/domain/researchPath";

function failure(outcome:PromiseSettledResult<unknown>,label:string):string|null{
 if(outcome.status!=="rejected")return null;
 return label+": "+(outcome.reason instanceof Error?outcome.reason.message:"Unavailable backend source");
}
export default async function ResearchPathPage({
 searchParams
}:{searchParams:Promise<{ticker?:string}>}){
 const query=await searchParams;
 const ticker=researchPathTicker(query.ticker);
 const invalid=query.ticker!==undefined&&!ticker;
 const mode=process.env.MARKET_LENS_DATA_SOURCE??"mock";
 const backend=process.env.DONGHAK_API_BASE_URL;
 const configured=mode!=="http"||Boolean(backend?.trim());
 const source=configured?getDataSource():null;
 const results=await Promise.allSettled([
  source?source.getStocks():Promise.resolve(null),
  source?source.getModelSummaries():Promise.resolve(null),
  source?source.getCoverageSummary():Promise.resolve(null),
  getScreener(),
  getOperations(),
  mode==="http"?loadOperationalCatalog(backend):Promise.resolve(null),
  mode==="http"?loadPublishedPortfolios(backend,0):Promise.resolve(null)
 ]);
 const [stocks,models,coverage,analysis,operations,operational,portfolios]=results;
 const stockList=stocks.status==="fulfilled"?stocks.value:null;
 const modelList=models.status==="fulfilled"?models.value:null;
 const research=coverage.status==="fulfilled"?coverage.value:null;
 const screener=analysis.status==="fulfilled"?analysis.value:null;
 const runs=operations.status==="fulfilled"?operations.value:null;
 const market=operational.status==="fulfilled"?operational.value:null;
 const archive=portfolios.status==="fulfilled"?portfolios.value:null;
 const missing=mode==="http"&&!configured?"HTTP backend base URL is not configured.":null;
 const stages=buildResearchPath({mode,ticker,source:{
  operational:{count:market?.data?.total??null,error:failure(operational,"Operational collection")??market?.error??missing},
  stocks:{count:stockList?.length??null,includesTicker:stockList?.some(stock=>stock.ticker===ticker)??false,
   error:failure(stocks,"Stock universe")??missing},
  models:{count:modelList?.length??null,error:failure(models,"Models")??missing},
  analysis:{count:screener?.data.entries.length??null,error:failure(analysis,"Published screener")??screener?.error??missing,
   source:screener?.source??"disconnected"},
  evidence:{count:research?.universe??null,unresolvedSecurities:research?.unresolvedSecurities??null,
   error:failure(coverage,"Research coverage")??missing},
  portfolios:{count:archive?.data?.total??null,error:failure(portfolios,"Published portfolios")??archive?.error??missing},
  operations:{count:runs?.snapshot.runs.length??null,error:failure(operations,"Recorded runs")??runs?.error??missing,
   source:runs?.source??"disconnected"}
 }});
 const attention=stages.filter(stage=>stage.status==="unavailable"||stage.status==="blocked");
 return <>
  <PageHeader eyebrow="Research workflow" title="Follow the evidence"
   badge={mode!=="http"?"Demonstration mode":attention.length?"Evidence requires review":"Recorded sources"}
   description="Navigate from collected observations to research identity, model qualification, original published signals, blockers and historical portfolios. Each stage is independent; there is no implied inference, live trade or approved forecast."/>
  <section className="panel single-panel" aria-label="Research path selection">
   <div className="panel-heading"><h2>Select research security</h2><span className="panel-count">{ticker??"No ticker selected"}</span></div>
   <form method="get" action="/research-path">
    <label htmlFor="research-path-ticker">Ticker</label>{" "}
    <input id="research-path-ticker" name="ticker" defaultValue={typeof query.ticker==="string"?query.ticker:""}
     maxLength={6} pattern="[0-9A-Za-z]{6}" placeholder="005930" required/>{" "}
    <button type="submit">Trace research</button>
   </form>
   {invalid?<p role="alert" className="metric-detail">Invalid ticker: use exactly six uppercase letters or digits.</p>:null}
   {ticker&&stockList&&!stockList.some(stock=>stock.ticker===ticker)?
    <p role="status" className="metric-detail">This ticker is not in the returned research catalog. No security identity or prediction is assumed.</p>:null}
   <p className="section-copy">Backend data mode: {mode}. {mode==="mock"?"All mock records are fictional examples.":mode==="http"?"Actual source availability is evaluated separately for each step, not inferred from backend health.":"HTTP source is not enabled."}</p>
  </section>
  <section className="panel single-panel" aria-label="Integrated research steps">
   <div className="panel-heading"><h2>Source evidence path</h2><span className="panel-count">{attention.length} steps needing review</span></div>
   {stages.map((stage,index)=><article className="operations-run" key={stage.id}>
    <div>
     <strong>{index+1}. {stage.title}</strong>
     <p className="metric-detail">{stage.note}</p>
     <p><Link href={stage.href}>Inspect recorded source</Link></p>
    </div>
    <span className="status-pill" data-state={stage.status==="observed"?"verified":stage.status==="blocked"?"blocked":"in_progress"}>{stage.status}</span>
   </article>)}
  </section>
  <section className="panel single-panel" aria-label="Research integrity limitations">
   <h2>Source and performance boundaries</h2>
   <p className="section-copy">Observed means source records were returned, not research readiness. Missing or 503 responses remain unavailable; no mock fallback is used in HTTP mode. Unreviewed operational OHLCV never becomes validated research, and the historical portfolio API supplies research-only simulated records without PIT/OOS or trading approval.</p>
   <p><Link href="/diagnostics">Inspect backend errors</Link> · <Link href="/research-workbench">Review model and publication provenance</Link> · <Link href="/backtesting/portfolios">Compare archived research reports</Link></p>
  </section>
 </>;
}
