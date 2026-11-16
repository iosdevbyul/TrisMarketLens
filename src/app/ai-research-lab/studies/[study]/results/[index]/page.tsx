import { Localize } from "@/i18n/Localize";
import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { getAutonomousResearchPublication } from "@/data/AutonomousResearchDataSource";
import { resultDetail } from "@/domain/aiResearchLab";

export const dynamic="force-dynamic";
function decimal(value:number|null){return value===null?"Not reported":value.toFixed(4);}
function flag(value:boolean|null){
  return value===null?"Not reported":value?"Recorded true (not independent certification)":"Recorded false";
}
export default async function LabResultDetail({
  params,
}:{
  params:Promise<{study:string;index:string}>;
}){
  const t=await getTranslator();
  const {study:studyLabel,index:rawIndex}=await params;
  const source=await getAutonomousResearchPublication();
  const study=source.publication?.studies.find(value=>value.study===studyLabel);
  if(!study || !/^(0|[1-9][0-9]{0,3})$/.test(rawIndex))notFound();
  const index=Number(rawIndex);
  const result=resultDetail(study,index);
  if(!result)notFound();
  const back="/ai-research-lab/studies/"+encodeURIComponent(study.study);
  return <>
    <Link href={back} className="back-link"><Localize text="← Study observations"/></Link>
    <PageHeader eyebrow="Read-only experiment evidence" title={t("Result observation") +" "+(index+1)}
      badge="Source record only"
      description="This record is projected from an actual autonomous_result artifact. The observation index is not an Experiment ID or a validated run→result relationship."/>
    <section className="panel single-panel" aria-label="Result evaluation metrics">
      <div className="panel-heading"><h2><Localize text="Retained evaluation metrics" /></h2><span className="panel-count">{study.study}</span></div>
      <div className="operations-overview-grid">
        {([
          ["Mean Average Precision",decimal(result.meanAp)],
          ["Stability AP",decimal(result.stabilityAp)],
          ["Worst balanced accuracy",decimal(result.worstBalancedAccuracy)],
          ["Largest train gap",result.largestTrainGap??"Not reported"],
        ] as const).map(([label,value])=><div className="operations-overview-stat" key={label}>
          <span><Localize text={label}/></span><strong><Localize text={String(value)}/></strong>
        </div>)}
      </div>
      <p className="metric-detail"><Localize text="These retrospective scores have no published per-observation comparable baseline, horizon, holdout cohort, training window or independent Final Test certificate. The web cannot establish a best search candidate or an independently validated winner." /></p>
    </section>
    <section className="panel single-panel" aria-label="Result integrity and approval flags">
      <div className="panel-heading"><h2><Localize text="Recorded review flags" /></h2><span className="panel-count"><Localize text="Never inferred" /></span></div>
      <div className="operations-overview-grid">
        {([
          ["PIT qualified",flag(result.pitQualified)],
          ["Performance approved",flag(result.performanceApproved)],
          ["Execution authorized",flag(result.executionAuthorized)],
          ["Deferred evaluation available",result.hasDeferredDiagnostic?"Present, outcome not published":"Not present"],
          ["Robustness summary available",result.hasRobustSummary?"Present, outcome not published":"Not present"],
          ["Generalization training available",result.hasGeneralizationTraining?"Present, outcome not published":"Not present"],
        ] as const).map(([label,value])=><div className="operations-overview-stat" key={label}>
          <span><Localize text={label}/></span><strong style={{fontSize:"14px",lineHeight:1.5}}><Localize text={value}/></strong>
        </div>)}
      </div>
      <p className="section-copy"><Localize text="A diagnostic object existing in the original study is not evidence that it passed. No raw model SHA, checkpoint, source PIN, hidden heldout details or original experiment identifiers are copied into this browser view. Any explicit true flag remains a retained artifact field and not permission to trade." /></p>
    </section>
    <section className="panel single-panel" aria-label="Result provenance limits">
      <h2><Localize text="Missing independent evidence" /></h2>
      <p className="section-copy"><Localize text="Report and plan identity, training/assessment dates, selection policy comparisons, final report and cohort diagnostics are unavailable in the current safe publication. This observation is not associated with an inferred run, terminal event or another study." /></p>
      <p><Link href={"/autonomous-research?study="+encodeURIComponent(study.study)}><Localize text="Inspect study-level metric distributions" /></Link></p>
    </section>
  </>;
}
