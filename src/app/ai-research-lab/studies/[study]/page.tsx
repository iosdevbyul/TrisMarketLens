import { Localize } from "@/i18n/Localize";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { getAutonomousResearchPublication } from "@/data/AutonomousResearchDataSource";
import { summarizeStudy } from "@/domain/aiResearchLab";
import { summarizeStudyEvidence } from "@/domain/autonomousResearchInsights";

export const dynamic="force-dynamic";
const display=(value:number|null)=>value===null?"Not reported":value.toFixed(4);
export default async function AIResearchStudyDetail({
  params,
}:{
  params:Promise<{study:string}>;
}){
  const {study:requested}=await params;
  const source=await getAutonomousResearchPublication();
  const study=source.publication?.studies.find(item=>item.study===requested);
  if(!study)notFound();
  const summary=summarizeStudy(study);
  const evidence=summarizeStudyEvidence(study);
  const href="/autonomous-research?study="+encodeURIComponent(study.study);
  return <>
    <Link className="back-link" href="/ai-research-lab"><Localize text="← AI Research Lab"/></Link>
    <PageHeader eyebrow="Retained research study" title={study.study} badge={study.truncated?"Partial publication":"Stored study"}
      description="Review actual recorded study evidence. The study folder label is not a verified Experiment ID, cohort ID or plan fingerprint, and this is not a live execution controller."/>
    <section className="panel single-panel" aria-label="Study record summary">
      <div className="panel-heading"><h2><Localize text="Study activity" /></h2><span className="panel-count">{evidence.complete?"Included records complete":"Partial evidence"}</span></div>
      <div className="operations-overview-grid">
        {([
          ["Run records",summary.runCount],
          ["Result records",summary.resultCount],
          ["Selection records",study.kinds.autonomous_selection],
          ["Terminal records",study.kinds.autonomous_terminal],
          ["Completed terminal records",summary.completedTerminals],
          ["Failed terminal records",summary.failedTerminals],
          ["Deferred diagnostics",evidence.diagnosticPresence.deferred],
          ["Robustness summary records",evidence.diagnosticPresence.robustness],
        ] as const).map(([name,value])=><div className="operations-overview-stat" key={name}>
          <span><Localize text={name}/></span><strong>{value}</strong>
        </div>)}
      </div>
      <p className="metric-detail">
        <Localize text="Last recorded run:"/> {summary.lastRecordedAt??<Localize text="Unreported"/>} · <Localize text="Agents:"/> {summary.agents.length?summary.agents.join(", "):<Localize text="Unreported"/>} ·
        <Localize text="Observed states:"/> {summary.observedStates.length?summary.observedStates.join(", "):<Localize text="Unreported"/>}
      </p>
      <p className="section-copy"><Localize text="Completion totals are terminal artifacts, not deduplicated experiments. Run, result and terminal positions have no publicly validated join key. No timeline, cause of improvement, or study-level independent validation is fabricated from record order." /></p>
    </section>
    <section className="panel single-panel" aria-label="Individual experiment observations">
      <div className="panel-heading"><h2><Localize text="Individual retained result observations" /></h2><span className="panel-count">{study.results.length} <Localize text="included"/></span></div>
      <p className="section-copy">
        Every row is an existing published result observation, not a new experiment claim.
        Observation numbers identify positions in this publication only; they are not
        DonghakStockVision Experiment IDs. No direct links to private model checkpoints or
        source-identifying PINs are exposed.
      </p>
      {study.results.length?<div className="stock-table" style={{overflowX:"auto"}}>
        <table style={{width:"100%",minWidth:"720px",textAlign:"left"}}>
          <thead><tr>{["Observation","Mean AP","Stability AP","Worst balanced accuracy","PIT qualified","Performance approved","Generalization evidence"].map(label=>
            <th key={label} scope="col" style={{padding:"10px"}}><Localize text={label}/></th>)}</tr></thead>
          <tbody>{study.results.map((result,index)=><tr key={index}>
            <td style={{padding:"10px"}}><Link href={"/ai-research-lab/studies/"+encodeURIComponent(study.study)+"/results/"+index}><Localize text="Observation"/> {index+1}</Link></td>
            <td style={{padding:"10px"}}>{display(result.meanAp)}</td>
            <td style={{padding:"10px"}}>{display(result.stabilityAp)}</td>
            <td style={{padding:"10px"}}>{display(result.worstBalancedAccuracy)}</td>
            <td style={{padding:"10px"}}><Localize text={result.pitQualified===null?"Unreported":result.pitQualified?"Recorded true":"Recorded false"}/></td>
            <td style={{padding:"10px"}}><Localize text={result.performanceApproved===null?"Unreported":result.performanceApproved?"Recorded true":"Recorded false"}/></td>
            <td style={{padding:"10px"}}><Localize text={result.hasDeferredDiagnostic||result.hasRobustSummary||result.hasGeneralizationTraining?"Diagnostic recorded":"Not provided"}/></td>
          </tr>)}</tbody>
        </table>
      </div>:<p className="section-copy"><Localize text="No result records in this study publication." /></p>}
      {study.results.length<study.kinds.autonomous_result?<p role="status" className="metric-detail">
        There are {study.kinds.autonomous_result-study.results.length} additional retained result records not included in this publication.
      </p>:null}
    </section>
    <section className="panel single-panel" aria-label="Study evidence limitations">
      <h2><Localize text="Qualification and follow-up" /></h2>
      <p className="section-copy">
        The source includes {evidence.approved} explicitly true performance-approval flags,
        {evidence.pitQualified} explicitly true PIT flags, and {evidence.executionAuthorized} explicitly true
        execution-authorization flags among included result observations. These raw flags do not
        constitute site-wide approval, an independently validated model, or permission to invest.
      </p>
      <p className="section-copy">
        Study hypothesis, selected-vs-best candidate, independent evaluation cohort, final report,
        and causal Experiment Memory links are not exposed by the current sanitized publication.
        They require a reviewed backend read-only contract; they are not guessed here.
      </p>
      <p><Link href={href}><Localize text="Inspect full within-study metric distribution and recorded run/terminal history" /></Link></p>
    </section>
  </>;
}
