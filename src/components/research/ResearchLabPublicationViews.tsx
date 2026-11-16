import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getTranslator } from "@/i18n/server";
import {
  labStudies,labStudy,labExperiments,labExperiment,labMemory,labReports,labReport,labComparisons,
  type ResearchLabStudy,type ResearchLabHorizon,type ResearchLabExperiment,type LabLoad,
} from "@/data/ResearchLabDataSource";

const base="/ai-research-lab";
const studyHref=(id:string)=>base+"/studies/"+encodeURIComponent(id);
const experimentHref=(id:string,e:string)=>studyHref(id)+"/experiments/"+encodeURIComponent(e);
const reportHref=(id:string)=>base+"/reports/"+encodeURIComponent(id);
const n=(value:number|null|undefined)=>value===null||value===undefined?"—":String(value);
const score=(value:number|null|undefined)=>value===null||value===undefined?"—":value.toFixed(4);
const truncated=(value:string)=>value.length>18?value.slice(0,12)+"…"+value.slice(-6):value;
const offsetOf=(raw:string|undefined)=>raw && /^\d{1,5}$/.test(raw)?Math.min(10000,Number(raw)):0;
const idLinks=(id:string)=> <code title={id} style={{overflowWrap:"anywhere"}}>{truncated(id)}</code>;

function Unavailable({message}:{message:string}) {
  return <section className="panel single-panel" role="status">
    <h2>Research Lab publication unavailable</h2>
    <p className="section-copy">{message}</p>
    <p className="metric-detail">The web does not substitute fabricated studies, reports, experiment IDs or model performance. An approved local Research Lab publication and loopback API are required.</p>
  </section>;
}
function Limits() {
  return <p className="metric-detail">
    Research-only historical evidence. Deferred diagnostics are retrospective, not independent future validation. PIT qualification, independent validation, performance approval and trading authorization are not established.
  </p>;
}
function Pagination({path,offset,total,limit}:{path:string;offset:number;total:number;limit:number}) {
  return <p className="metric-detail">
    {offset>0?<Link href={path+"?offset="+Math.max(0,offset-limit)}>Previous</Link>:null}
    {" "} {total?offset+1:0}–{Math.min(total,offset+limit)} / {total} {" "}
    {offset+limit<total?<Link href={path+"?offset="+(offset+limit)}>Next</Link>:null}
  </p>;
}
function HorizonTable({horizons,studyId}:{horizons:ResearchLabHorizon[];studyId?:string}) {
  return <div className="stock-table" style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:600,textAlign:"left"}}>
    <thead><tr>{["Horizon","Completed candidates","Selected experiment","Selected mean AP","Best seen AP"].map(x=><th key={x} scope="col" style={{padding:10}}>{x}</th>)}</tr></thead>
    <tbody>{horizons.map(h=><tr key={h.horizon}>
      <td style={{padding:10}}>{h.horizon}</td><td style={{padding:10}}>{h.experimentCount}</td>
      <td style={{padding:10}}>{h.selectedExperimentId?studyId?<Link href={experimentHref(studyId,h.selectedExperimentId)}>{idLinks(h.selectedExperimentId)}</Link>:idLinks(h.selectedExperimentId):"Not selected"}</td>
      <td style={{padding:10}}>{score(h.selectedMeanAP)}</td><td style={{padding:10}}>{score(h.bestSeenAP)}</td>
    </tr>)}</tbody></table></div>;
}
function StudySummary({study}:{study:ResearchLabStudy}) {
  return <div className="operations-run">
    <div style={{minWidth:0,overflowWrap:"anywhere"}}>
      <strong><Link href={studyHref(study.studyId)}>{study.cohort} / {study.selectionPolicy}</Link></strong>
      <p className="metric-detail">Study {idLinks(study.studyId)} · {study.completed} completed / {study.failed} failed · budget {study.experimentBudget}</p>
      <p className="metric-detail">Report <Link href={reportHref(study.reportId)}>{idLinks(study.reportId)}</Link> · {study.horizons.length} horizons · Independent validation: {study.independentValidationStatus}</p>
    </div>
    <span className="status-pill" data-state="blocked">Research only</span>
  </div>;
}
export async function PublishedLabOverview({offset=0}:{offset?:number}) {
  const t=await getTranslator();
  const [studies,reports,comparisons]=await Promise.all([labStudies(offset,25),labReports(0,25),labComparisons()]);
  const available=studies.data;
  if(!available)return <Unavailable message={t(studies.message)}/>;
  const completed=available.items.reduce((sum,s)=>sum+s.completed,0);
  return <div>
    <section className="panel single-panel" aria-label="Approved Research Lab overview">
      <div className="panel-heading"><h2>{t("Approved Research Lab overview")}</h2><span className="panel-count">{available.total} {t("studies")}</span></div>
      <p className="section-copy">{t("Original Plan IDs and approved report links are supplied by the backend. Counts refer to the returned page, not inferred experiments.")}</p>
      <div className="operations-overview-grid">
        {[["Studies (all)",available.total],["Completed experiments (current page)",completed],["Final reports",reports.data?.total??"Unavailable"],["Comparison groups",comparisons.data?.items.length??"Unavailable"]].map(([label,value])=><div className="operations-overview-stat" key={label}><span>{t(String(label))}</span><strong>{value}</strong></div>)}
      </div>
      {reports.state!=="available"?<p role="status">{t(reports.message)}</p>:null}
      {comparisons.state!=="available"?<p role="status">{t(comparisons.message)}</p>:null}
      <Limits/>
    </section>
    <section className="panel single-panel" aria-label="Research study catalog">
      <div className="panel-heading"><h2>{t("Research studies")}</h2><span className="panel-count">{available.total}</span></div>
      {available.items.map(study=><StudySummary key={study.studyId} study={study}/>)}
      <Pagination path={base} offset={available.offset} total={available.total} limit={available.limit}/>
    </section>
    <section className="panel single-panel">
      <h2>{t("Explore research evidence")}</h2>
      <p><Link href={base+"/reports"}>{t("Final research reports")}</Link> · <Link href={base+"/comparisons"}>{t("Matched policy comparisons")}</Link></p>
      <p className="metric-detail">{t("Experiments, memory and selected model metrics are linked from each real Study ID.")}</p>
    </section>
  </div>;
}
export async function PublishedStudy({id,offset=0}:{id:string;offset?:number}) {
  const t=await getTranslator();
  const [study,experiments,memory]=await Promise.all([labStudy(id),labExperiments(id,offset,25),labMemory(id)]);
  if(!study.data)return <Unavailable message={t(study.message)}/>;
  const s=study.data;
  return <>
    <Link className="back-link" href={base}>{t("Back to AI Research Lab")}</Link>
    <PageHeader eyebrow="Approved Study" title={s.cohort+" / "+s.selectionPolicy} badge="Research only" description="Original Study Plan ID, verified experiment relationships and retrospective metrics from the approved read-only publication."/>
    <section className="panel single-panel">
      <h2>{t("Study scope")}</h2>
      <p className="metric-detail">Study ID: {idLinks(s.studyId)} · {t("Comparison group")}: {idLinks(s.comparisonGroupId)}</p>
      <p className="metric-detail">{s.completed} {t("completed")} / {s.failed} {t("failed")} · {t("Experiment budget")}: {s.experimentBudget}</p>
      <p><Link href={reportHref(s.reportId)}>{t("Read final report")} ({idLinks(s.reportId)})</Link></p>
      <Limits/>
    </section>
    <section className="panel single-panel"><h2>{t("Selected models by horizon")}</h2>
      <HorizonTable horizons={s.horizons} studyId={s.studyId}/>
      <p className="metric-detail">{t("Best seen AP is the strongest observed candidate, not the performance of the selected model.")}</p>
    </section>
    <section className="panel single-panel">
      <h2>{t("Experiment explorer")}</h2>
      {experiments.data?<><div className="operations-runs">{experiments.data.items.map(e=><div className="operations-run" key={e.experimentId}>
        <div><strong><Link href={experimentHref(id,e.experimentId)}>{idLinks(e.experimentId)}</Link></strong>
        <p className="metric-detail">{t("Horizon")}: {e.horizon} · {t("Model family")}: {e.modelFamily} · {t(e.status)} · {t("Mean AP")}: {score(e.meanAP)}</p></div>
        <span className="status-pill" data-state={e.selectedForHorizon?"verified":"in_progress"}>{t(e.selectedForHorizon?"Selected":"Candidate")}</span>
      </div>)}</div><Pagination path={studyHref(id)} offset={experiments.data.offset} total={experiments.data.total} limit={experiments.data.limit}/></>:<p role="status">{t(experiments.message)}</p>}
    </section>
    <section className="panel single-panel"><h2>{t("Experiment Memory")}</h2>
      {memory.data?<><p>{t("Selection changes")}: {n(memory.data.memoryChangedChoices)} · {memory.data.events.length} {t("discovery events")}</p>
      <div className="operations-runs">{memory.data.events.map((e,index)=><div className="operations-run" key={e.experimentId}>
        <div><strong><Link href={experimentHref(id,e.experimentId)}>{index+1}. {idLinks(e.experimentId)}</Link></strong>
        <p className="metric-detail">{t("Selection order")}: {n(e.selectionOrder)} · {t("Cache reused")}: {e.cacheReused===null?"—":e.cacheReused?t("Yes"):t("No")}</p>
        <p className="metric-detail">{t("Parent experiment")}: {e.parentExperimentId?<Link href={experimentHref(id,e.parentExperimentId)}>{idLinks(e.parentExperimentId)}</Link>:t("Not reported")}</p></div>
      )}</div>
      <p className="metric-detail">{t("Memory events describe historical search, not proven causal LLM improvement.")}</p>
      </>:<p role="status">{t(memory.message)}</p>}
    </section>
  </>;
}
function MetricMatrix({metrics}:{metrics:Array<Record<string,number|null>|null>}) {
  return <div className="stock-table" style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:600,textAlign:"left"}}>
    <thead><tr>{["Fold","AP","Balanced accuracy","Brier score"].map(x=><th style={{padding:10}} key={x}>{x}</th>)}</tr></thead>
    <tbody>{metrics.map((m,index)=><tr key={index}><td style={{padding:10}}>{index+1}</td><td style={{padding:10}}>{score(m?.pr_auc_ap)}</td><td style={{padding:10}}>{score(m?.balanced_accuracy)}</td><td style={{padding:10}}>{score(m?.brier_score)}</td></tr>)}</tbody></table></div>;
}
export async function PublishedExperiment({studyId,id}:{studyId:string;id:string}) {
  const t=await getTranslator();
  const result=await labExperiment(studyId,id);
  if(!result.data)return <Unavailable message={t(result.message)}/>;
  const e=result.data;
  return <>
    <Link className="back-link" href={studyHref(studyId)}>{t("Back to study")}</Link>
    <PageHeader eyebrow="Experiment evidence" title={t("Experiment detail")} badge={e.selectedForHorizon?"Selected for horizon":"Historical experiment"} description="Original Experiment ID from an approved read-only publication. Seen-fold measurements and deferred diagnostics are not independent forward validation."/>
    <section className="panel single-panel">
      <h2>{t("Experiment identity")}</h2>
      <p className="metric-detail">{t("Study ID")}: {idLinks(studyId)} · {t("Experiment ID")}: {idLinks(id)}</p>
      <p className="metric-detail">{t("Horizon")}: {e.horizon} · {t("Model family")}: {e.modelFamily} · {t("Stock policy")}: {String(e.stockPolicy??"—")} · {t("Status")}: {t(e.status)}</p>
      <p>{t("Parent experiment")}: {e.parentExperimentId?<Link href={experimentHref(studyId,e.parentExperimentId)}>{idLinks(e.parentExperimentId)}</Link>:t("Not reported")}</p>
      <p>{t("Mean AP")}: {score(e.meanAP)} · {t("Stability AP")}: {score(e.stabilityAP)} · {t("Train gap")}: {n(e.largestTrainGap)}</p>
      <p><Link href={reportHref(e.reportId)}>{t("Related final report")}</Link></p>
    </section>
    <section className="panel single-panel"><h2>{t("Seen fold evaluation")}</h2>
      {e.seenFoldMetrics.length?<MetricMatrix metrics={e.seenFoldMetrics}/>:<p>{t("Not published")}</p>}
    </section>
    <section className="panel single-panel"><h2>{t("Fold baselines")}</h2>
      {e.seenFoldBaselines.map((fold,index)=><div className="operations-run" key={index}><div>
        <strong>{t("Fold")} {index+1}</strong>
        {(["training_prior","training_majority","momentum"] as const).map(key=><p className="metric-detail" key={key}>{key}: AP {score(fold[key]?.pr_auc_ap)} · BA {score(fold[key]?.balanced_accuracy)} · Brier {score(fold[key]?.brier_score)}</p>)}
      </div></div>)}
      {!e.seenFoldBaselines.length?<p>{t("Not published")}</p>:null}
    </section>
    <section className="panel single-panel"><h2>{t("Retrospective generalization diagnostic")}</h2>
      <p className="section-copy">{e.deferredDiagnostic===null?t("No deferred diagnostic was published."):t("A deferred diagnostic is recorded. It is retrospective descriptive evidence, not independent future validation.")}</p>
      {e.robustSummary?<p className="metric-detail">{t("Robustness summary recorded")}; {t("inspect published qualification flags without assuming approval.")}</p>:null}
      <Limits/>
    </section>
  </>;
}
export async function PublishedReports({offset=0}:{offset?:number}) {
  const t=await getTranslator();const r=await labReports(offset,25);
  return <><Link className="back-link" href={base}>{t("Back to AI Research Lab")}</Link>
    <PageHeader eyebrow="Research reports" title="Final research reports" badge="Operator-approved projection" description="Published report summaries only; original raw JSON and private source references are not exposed."/>
    {!r.data?<Unavailable message={t(r.message)}/>:<section className="panel single-panel"><h2>{t("Final reports")} ({r.data.total})</h2>
      {r.data.items.map(s=><StudySummary study={s} key={s.reportId}/>)}
      <Pagination path={base+"/reports"} offset={r.data.offset} total={r.data.total} limit={r.data.limit}/><Limits/></section>}
  </>;
}
export async function PublishedReport({id}:{id:string}) {
  const t=await getTranslator();const r=await labReport(id);
  if(!r.data)return <Unavailable message={t(r.message)}/>;
  const s=r.data;
  return <><Link className="back-link" href={base+"/reports"}>{t("Back to reports")}</Link>
    <PageHeader eyebrow="Approved final report" title={s.cohort+" / "+s.selectionPolicy} badge="Historical research only" description="Allowlisted final report fields, not an original report download or trading authorization."/>
    <section className="panel single-panel"><h2>{t("Research report")}</h2>
      <p className="metric-detail">{t("Report ID")}: {idLinks(s.reportId)} · <Link href={studyHref(s.studyId)}>{t("Study details")}</Link></p>
      <p className="metric-detail">{t("Research period")}: {s.researchPeriod.first_date} – {s.researchPeriod.last_date} · {s.researchPeriod.dates} {t("dates")} · {s.researchPeriod.observations} {t("observations")}</p>
      <p className="metric-detail">{t("Completed")}: {s.completed} · {t("Failed")}: {s.failed} · {t("Cache hits")}: {n(s.cacheHits)} · {t("Memory selection changes")}: {n(s.memoryChangedChoices)}</p>
      <p className="metric-detail">{t("Learner seconds")}: {n(s.learnerSeconds)} · {t("Maximum RSS KB")}: {n(s.maximumRssKb)}</p>
      <Limits/>
    </section>
    <section className="panel single-panel"><h2>{t("Horizon selections and performance")}</h2><HorizonTable horizons={s.horizons} studyId={s.studyId}/></section>
    <section className="panel single-panel"><h2>{t("Report limitations")}</h2><p className="section-copy">{s.limitations.map(v=>t(v.replaceAll("_"," "))).join(" · ")}</p><Limits/></section>
  </>;
}
export async function PublishedComparisons() {
  const t=await getTranslator();const r=await labComparisons();
  return <><Link className="back-link" href={base}>{t("Back to AI Research Lab")}</Link>
    <PageHeader eyebrow="Research policy comparison" title="Adaptive / Predeclared / Robust" badge="Descriptive only" description="Compare policies only within matching backend-provided cohort and comparison conditions. Differences do not establish causal superiority."/>
    {!r.data?<Unavailable message={t(r.message)}/>:r.data.items.map(group=><section className="panel single-panel" key={group.comparisonGroupId}>
      <div className="panel-heading"><h2>{group.cohort}</h2><span className="panel-count">{group.completeThreeArmComparison?t("Three matching policies"):t("Incomplete policy arms")}</span></div>
      <p className="metric-detail">{t("Comparison group")}: {idLinks(group.comparisonGroupId)} · {group.policies.join(" / ")}</p>
      {group.horizons.map(h=><div key={h.horizon}><h3>{t("Horizon")} {h.horizon}</h3>
        <div className="operations-runs">{h.arms.map(arm=><div className="operations-run" key={arm.studyId}>
          <div><strong><Link href={studyHref(arm.studyId)}>{arm.policy}</Link></strong>
          <p className="metric-detail">{t("Selected mean AP")}: {score(arm.selectedMeanAP)} · {t("Best seen AP")}: {score(arm.bestSeenAP)} · {t("Selected experiment")}: {arm.selectedExperimentId?<Link href={experimentHref(arm.studyId,arm.selectedExperimentId)}>{idLinks(arm.selectedExperimentId)}</Link>:t("Not selected")}</p></div>
        </div>)}</div></div>)}
      <p className="section-copy">{t("Policy superiority is not established.")} {group.completeThreeArmComparison?t("Matching comparison arms are present."):t("A complete three-arm comparison is unavailable.")}</p><Limits/>
    </section>)}
  </>;
}
