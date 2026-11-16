import type { AutonomousResearchPublication, ResearchStudyView, ResearchResultView } from "./autonomousResearchPublication";

export type LabStatus = "completed" | "failed" | "interrupted" | "paused" | "running" | "unreported";
export type StudyEntry = {
  study: string;
  lastRecordedAt: string | null;
  latestRecordedState: string | null;
  observedStates: LabStatus[];
  agents: string[];
  runCount: number;
  resultCount: number;
  completedTerminals: number;
  failedTerminals: number;
  otherTerminals: number;
  hasDiagnostics: boolean;
  partial: boolean;
};

const KNOWN_STATUSES: Record<string, LabStatus> = {
  completed: "completed", succeeded: "completed", success: "completed",
  failed: "failed", error: "failed",
  interrupted: "interrupted", cancelled: "interrupted", canceled: "interrupted",
  paused: "paused", deferred: "paused", blocked: "paused",
  running: "running", active: "running", in_progress: "running",
};

/** State labels are derived from recorded artifacts, never live process observation. */
export function recordedStatus(value: string | null): LabStatus {
  return value ? KNOWN_STATUSES[value.trim().toLowerCase()] ?? "unreported" : "unreported";
}
function latestRun(study: ResearchStudyView) {
  return study.runs.filter(run=>run.recordedAt && Number.isFinite(Date.parse(run.recordedAt)))
    .sort((a,b)=>Date.parse(b.recordedAt!) - Date.parse(a.recordedAt!))[0] ?? null;
}
export function summarizeStudy(study: ResearchStudyView): StudyEntry {
  const run = latestRun(study);
  const terminalStates=study.terminals.map(item=>recordedStatus(item.state));
  const runStates=study.runs.map(item=>recordedStatus(item.state));
  return {
    study:study.study,
    lastRecordedAt:run?.recordedAt ?? null,
    latestRecordedState:run?.state ?? null,
    observedStates:[...new Set([...runStates,...terminalStates])],
    agents:[...new Set(study.runs.map(item=>item.agent).filter((item):item is string=>item!==null))].sort(),
    runCount:study.kinds.autonomous_run,
    resultCount:study.kinds.autonomous_result,
    completedTerminals:terminalStates.filter(x=>x==="completed").length,
    failedTerminals:terminalStates.filter(x=>x==="failed").length,
    otherTerminals:terminalStates.filter(x=>x!=="completed"&&x!=="failed").length,
    hasDiagnostics:study.results.some(item=>item.hasDeferredDiagnostic||item.hasRobustSummary||item.hasGeneralizationTraining),
    partial:study.truncated,
  };
}
export function searchStudies(publication: AutonomousResearchPublication, query: {
  search?: string; state?: string; agent?: string;
}): StudyEntry[] {
  const search=(query.search??"").trim().toLowerCase().slice(0,80);
  const state=query.state && query.state!=="all" ? recordedStatus(query.state) : null;
  const agent=(query.agent??"").trim().toLowerCase().slice(0,80);
  return publication.studies.map(summarizeStudy).filter(item=>
    (!search || item.study.toLowerCase().includes(search)
      || item.agents.some(value=>value.toLowerCase().includes(search)))
    && (!state || item.observedStates.includes(state))
    && (!agent || item.agents.some(value=>value.toLowerCase()===agent)))
    .sort((a,b)=> (b.lastRecordedAt??"").localeCompare(a.lastRecordedAt??"") || a.study.localeCompare(b.study));
}

export function labOverview(publication: AutonomousResearchPublication) {
  const studies=publication.studies.map(summarizeStudy);
  const times=studies.map(x=>x.lastRecordedAt).filter((x):x is string=>x!==null).sort();
  return {
    studiesIncluded:publication.studyCount,
    omittedDatabases:publication.skippedStudyCount,
    runRecords:publication.aggregateCounts.autonomous_run,
    resultRecords:publication.aggregateCounts.autonomous_result,
    terminalRecords:publication.aggregateCounts.autonomous_terminal,
    selectionRecords:publication.aggregateCounts.autonomous_selection,
    observedTerminalCompleted:studies.reduce((sum,item)=>sum+item.completedTerminals,0),
    observedTerminalFailed:studies.reduce((sum,item)=>sum+item.failedTerminals,0),
    observedTerminalOther:studies.reduce((sum,item)=>sum+item.otherTerminals,0),
    latestRunTime:times.at(-1)??null,
    hasIncompleteEvidence:publication.containsPartialStudies,
  };
}

export function resultDetail(study: ResearchStudyView, index: number): ResearchResultView | null {
  // Index is the position of the bounded publication record, NOT an Experiment ID.
  if (!Number.isSafeInteger(index) || index < 0) return null;
  return study.results[index] ?? null;
}
