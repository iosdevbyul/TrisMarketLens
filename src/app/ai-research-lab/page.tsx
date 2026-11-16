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
      <div className="panel-heading"><h2>Research evidence source</h2><span className="panel-count">{source.state}</span></div>
      <p className="section-copy" role="status">{source.message}</p>
      {publication?<p className="metric-detail">
        Generated {publication.generatedAt}. This is an operator-produced, manually refreshed local publication,
        not live process telemetry. {publication.skippedStudyCount} database sources were excluded from the export;
        do not interpret displayed counts as the full history of DonghakStockVision.
      </p>:<p className="metric-detail">
        The existing read-only local research publication is required. No fictional studies, reports,
        model rankings or experiment history are substituted when unavailable.
        <Link href="/autonomous-research"> Inspect publication configuration</Link>.
      </p>}
    </section>
    {overview?<section className="panel single-panel" aria-label="AI research lab overview">
      <div className="panel-heading"><h2>Observed research activity</h2><span className="panel-count">Retained artifacts, not deduplicated trials</span></div>
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
          <span>{label}</span><strong>{value}</strong>
        </div>)}
      </div>
      <p className="metric-detail">
        Most recently recorded run: {overview.latestRunTime??"Unreported"}.
        Completion and failure counts describe terminal records only, not distinct experiments.
        Research may have progressed since this publication was generated.
        No current CPU, memory or live process state is available from this snapshot.
      </p>
      {overview.hasIncompleteEvidence?<p role="status" className="section-copy">
        Coverage is partial; some source databases or rows were skipped or capped.
      </p>:null}
    </section>:null}
    <section className="panel single-panel" aria-label="Research qualification boundaries">
      <div className="panel-heading"><h2>What can be established?</h2><span className="panel-count">No inferred approval</span></div>
      <div className="operations-overview-grid">
        {([
          ["Search candidate leader","Unavailable without comparable candidate scope"],
          ["Policy-selected model","Requires linked experiment IDs and policy decisions"],
          ["Independently validated model","Not established by retained AP alone"],
          ["Sealed Final Test","Not published to the web"],
          ["PIT qualification","No site-wide certificate"],
          ["Investment readiness","Not established"],
        ] as const).map(([label,value])=><div className="operations-overview-stat" key={label}><span>{label}</span><strong style={{fontSize:"14px",lineHeight:"1.5"}}>{value}</strong></div>)}
      </div>
      <p className="section-copy">
        The retained study evidence has explicit per-record flags in the existing research views, but
        it does not prove independent future performance or investment permission. Cross-study AP
        ranking is deliberately disabled because dataset and evaluation conditions are not linked.
      </p>
    </section>
    {publication?<section className="panel single-panel" aria-label="Research study explorer">
      <div className="panel-heading"><h2>Search retained research studies</h2><span className="panel-count">{entries.length} matches</span></div>
      <form action="/ai-research-lab" method="get" className="stock-explorer">
        <label htmlFor="lab-query">Study label or research agent</label>
        <input id="lab-query" name="q" defaultValue={q} maxLength={80} placeholder="historical-expansion"/>
        <label htmlFor="lab-status">Recorded state</label>
        <select id="lab-status" name="state" defaultValue={state}>
          {statusOptions.map(value=><option key={value} value={value}>{value==="all"?"All recorded states":value}</option>)}
        </select>
        <label htmlFor="lab-agent">Research agent</label>
        <select id="lab-agent" name="agent" defaultValue={agent}>
          <option value="">All recorded agents</option>
          {agents.map(value=><option key={value} value={value}>{value}</option>)}
        </select>
        <button type="submit">Filter studies</button>
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
              {item.runCount} run records · {item.resultCount} result records ·
              {item.completedTerminals} completed terminals · {item.failedTerminals} failed terminals
            </p>
            <p className="metric-detail">
              Agents: {item.agents.length?item.agents.join(", "):"Unreported"} ·
              Last recorded run: {item.lastRecordedAt??"Unreported"} ·
              State evidence: {item.observedStates.length?item.observedStates.join(", "):"Unreported"}
            </p>
          </div>
          <span className="status-pill" data-state={item.partial?"blocked":"in_progress"}>
            {item.partial?"Partial publication":item.hasDiagnostics?"Diagnostics recorded":"Retained"}
          </span>
        </article>)}
      </div>:<p role="status" className="section-copy">No retained studies match the filters. No new research data is inferred.</p>}
      <div style={{display:"flex",gap:"20px",marginTop:"16px"}}>
        {currentPage>1?<Link href={nextHref(currentPage-1)}>Previous page</Link>:null}
        <span className="metric-detail">Page {currentPage} of {pageCount}</span>
        {currentPage<pageCount?<Link href={nextHref(currentPage+1)}>Next page</Link>:null}
      </div>
    </section>:null}
    <section className="panel single-panel" aria-label="Research lab linked views">
      <h2>Further verified research surfaces</h2>
      <p className="section-copy">
        <Link href="/autonomous-research">Detailed study metrics and distributions</Link> ·
        {" "}<Link href="/research-status">Research publication and LLM management status</Link> ·
        {" "}<Link href="/ai-research-models">Research LLM comparisons</Link> ·
        {" "}<Link href="/backend-api-coverage">Backend API parity</Link>
      </p>
    </section>
  </>;
}
