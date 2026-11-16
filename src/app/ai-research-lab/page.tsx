import { Localize } from "@/i18n/Localize";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getAutonomousResearchPublication } from "@/data/AutonomousResearchDataSource";
import { labOverview, searchStudies } from "@/domain/aiResearchLab";

export const dynamic="force-dynamic";
const statusOptions=["all","completed","failed","interrupted","paused","running","unreported"] as const;

export default async function AIResearchLabPage({
  searchParams,
}: {
  searchParams:Promise<{q?:string;state?:string;agent?:string;page?:string}>;
}){
  const params=await searchParams;
  const source=await getAutonomousResearchPublication();
  const publication=source.publication;
  const q=typeof params.q==="string"?params.q.trim().slice(0,80):"";
  const agent=typeof params.agent==="string"?params.agent.trim().slice(0,80):"";
  const state=typeof params.state==="string"&&statusOptions.some(item=>item===params.state)?params.state:"all";
  const page=typeof params.page==="string"&&/^[0-9]{1,4}$/.test(params.page)?Math.max(1,Number(params.page)):1;
  const entries=publication?searchStudies(publication,{search:q,agent,state}):[];
  const overview=publication?labOverview(publication):null;
  const agents=publication?[...new Set(publication.studies.flatMap(study=>study.runs.map(run=>run.agent).filter((value):value is string=>value!==null)))].sort():[];
  const pageCount=Math.max(1,Math.ceil(entries.length/12));
  const currentPage=Math.min(page,pageCount);
  const visible=entries.slice((currentPage-1)*12,currentPage*12);
  const nextHref=(index:number)=>"/ai-research-lab?"+new URLSearchParams({q,state,agent,page:String(index)}).toString();
  return <>
    <PageHeader eyebrow="AI Research Lab" title="Donghak autonomous research"
      badge={publication?"Retained research publication":source.state}
      description="A read-only research observatory built from actual retained DonghakStockVision experiment records. Evidence, failures and unknowns remain distinct; this screen never launches research or authorizes investments."/>
    <section className="panel single-panel" aria-label="AI research lab publication">
      <div className="panel-heading"><h2><Localize text="Research evidence source" /></h2><span className="panel-count"><Localize text={source.state}/></span></div>
      <p className="section-copy" role="status">{source.message}</p>
      {publication?<p className="metric-detail">
        Generated {publication.generatedAt}. This is an operator-produced, manually refreshed local publication,
        not live process telemetry. {publication.skippedStudyCount} database sources were excluded from the export;
        do not interpret displayed counts as the full history of DonghakStockVision.
      </p>:<p className="metric-detail"><Localize text="The existing read-only local research publication is required. No fictional studies, reports, model rankings or experiment history are substituted when unavailable." /><Link href="/autonomous-research">{" "}<Localize text="Inspect publication configuration" /></Link>.
      </p>}
    </section>
    {overview?<section className="panel single-panel" aria-label="AI research lab overview">
      <div className="panel-heading"><h2><Localize text="Observed research activity" /></h2><span className="panel-count"><Localize text="Retained artifacts, not deduplicated trials" /></span></div>
      <div className="operations-overview-grid">
        {([
          ["Included research databases",overview.studiesIncluded],
          ["Research run records",overview.runRecords],
          ["Experiment result records",overview.resultRecords],
          ["Completed terminal records",overview.observedTerminalCompleted],
          ["Failed terminal records",overview.observedTerminalFailed],
          ["Other terminal states",overview.observedTerminalOther],
          ["Candidate selection records",overview.selectionRecords],
          ["Final reviewed reports","Not published"],
          ["Live research execution","Not verifiable"],
        ] as const).map(([label,value])=><div className="operations-overview-stat" key={label}>
          <span><Localize text={label}/></span><strong>{typeof value==="string"?<Localize text={value}/>:value}</strong>
        </div>)}
      </div>
      <p className="metric-detail">
        <Localize text="Most recently recorded run:"/> {overview.latestRunTime??<Localize text="Unreported"/>}.
        Completion and failure counts describe terminal records only, not distinct experiments.
        Research may have progressed since this publication was generated.
        No current CPU, memory or live process state is available from this snapshot.
      </p>
      {overview.hasIncompleteEvidence?<p role="status" className="section-copy">
        Coverage is partial; some source databases or rows were skipped or capped.
      </p>:null}
    </section>:null}
    <section className="panel single-panel" aria-label="Research qualification boundaries">
      <div className="panel-heading"><h2><Localize text="What can be established?" /></h2><span className="panel-count"><Localize text="No inferred approval" /></span></div>
      <div className="operations-overview-grid">
        {([
          ["Search candidate leader","Unavailable without comparable candidate scope"],
          ["Policy-selected model","Requires linked experiment IDs and policy decisions"],
          ["Independently validated model","Not established by retained AP alone"],
          ["Sealed Final Test","Not published to the web"],
          ["PIT qualification","No site-wide certificate"],
          ["Investment readiness","Not established"],
        ] as const).map(([label,value])=><div className="operations-overview-stat" key={label}><span><Localize text={label}/></span><strong style={{fontSize:"14px",lineHeight:"1.5"}}><Localize text={value}/></strong></div>)}
      </div>
      <p className="section-copy"><Localize text="The retained study evidence has explicit per-record flags in the existing research views, but it does not prove independent future performance or investment permission. Cross-study AP ranking is deliberately disabled because dataset and evaluation conditions are not linked." /></p>
    </section>
    {publication?<section className="panel single-panel" aria-label="Research study explorer">
      <div className="panel-heading"><h2><Localize text="Search retained research studies" /></h2><span className="panel-count">{entries.length} <Localize text="matches"/></span></div>
      <form action="/ai-research-lab" method="get" className="stock-explorer">
        <label htmlFor="lab-query"><Localize text="Study label or research agent" /></label>
        <input id="lab-query" name="q" defaultValue={q} maxLength={80} placeholder="historical-expansion"/>
        <label htmlFor="lab-status"><Localize text="Recorded state" /></label>
        <select id="lab-status" name="state" defaultValue={state}>
          {statusOptions.map(value=><option key={value} value={value}><Localize text={value==="all"?"All recorded states":value}/></option>)}
        </select>
        <label htmlFor="lab-agent"><Localize text="Research agent" /></label>
        <select id="lab-agent" name="agent" defaultValue={agent}>
          <option value=""><Localize text="All recorded agents" /></option>
          {agents.map(value=><option key={value} value={value}>{value}</option>)}
        </select>
        <button type="submit"><Localize text="Filter studies" /></button>
      </form>
      <p className="metric-detail">
        States are observed in retained run or terminal artifacts; a recorded running state is not proof
        that a process is executing now. Study labels are storage labels, not a verified cohort,
        horizon or selection-policy contract. Filters requiring those contracts are deferred.
      </p>
      {visible.length?<div className="operations-runs">
        {visible.map(item=><article className="operations-run" key={item.study}>
          <div style={{minWidth:0,overflowWrap:"anywhere"}}>
            <strong><Link href={"/ai-research-lab/studies/"+encodeURIComponent(item.study)}>{item.study}</Link></strong>
            <p className="metric-detail">
              {item.runCount} <Localize text="run records"/> · {item.resultCount} <Localize text="result records"/> ·
              {item.completedTerminals} <Localize text="completed terminals"/> · {item.failedTerminals} <Localize text="failed terminals"/>
            </p>
            <p className="metric-detail">
              <Localize text="Agents:"/> {item.agents.length?item.agents.join(", "):<Localize text="Unreported"/>} ·
              <Localize text="Last recorded run:"/> {item.lastRecordedAt??<Localize text="Unreported"/>} ·
              <Localize text="State evidence:"/> {item.observedStates.length?item.observedStates.map(x=>x).join(", "):<Localize text="Unreported"/>}
            </p>
          </div>
          <span className="status-pill" data-state={item.partial?"blocked":"in_progress"}>
            <Localize text={item.partial?"Partial publication":item.hasDiagnostics?"Diagnostics recorded":"Retained"}/>
          </span>
        </article>)}
      </div>:<p role="status" className="section-copy"><Localize text="No retained studies match the filters. No new research data is inferred." /></p>}
      <div style={{display:"flex",gap:"20px",marginTop:"16px"}}>
        {currentPage>1?<Link href={nextHref(currentPage-1)}><Localize text="Previous page" /></Link>:null}
        <span className="metric-detail">Page {currentPage} of {pageCount}</span>
        {currentPage<pageCount?<Link href={nextHref(currentPage+1)}><Localize text="Next page" /></Link>:null}
      </div>
    </section>:null}
    <section className="panel single-panel" aria-label="Research lab linked views">
      <h2><Localize text="Further verified research surfaces" /></h2>
      <p className="section-copy">
        <Link href="/autonomous-research"><Localize text="Detailed study metrics and distributions" /></Link> ·
        {" "}<Link href="/research-status"><Localize text="Research publication and LLM management status" /></Link> ·
        {" "}<Link href="/ai-research-models"><Localize text="Research LLM comparisons" /></Link> ·
        {" "}<Link href="/backend-api-coverage"><Localize text="Backend API parity" /></Link>
      </p>
    </section>
  </>;
}
