export type ResearchPublicationMetric = number | null;
export type ResearchRunView = {
  state: string | null; agent: string | null; recordedAt: string | null;
  attempts: number | null; completed: number | null; failed: number | null; remaining: number | null;
  trainedThisRun: number | null; cacheHits: number | null;
  llmAccepted: number | null; llmRejected: number | null;
  gemmaAccepted: number | null; gemmaRejected: number | null;
  pitQualified: boolean | null; performanceApproved: boolean | null;
  executionAuthorized: boolean | null; independentFuturePerformanceEstablished: boolean | null;
};
export type ResearchResultView = {
  meanAp: ResearchPublicationMetric; stabilityAp: ResearchPublicationMetric;
  worstBalancedAccuracy: ResearchPublicationMetric; largestTrainGap: number | null;
  pitQualified: boolean | null; performanceApproved: boolean | null;
  executionAuthorized: boolean | null;
  hasDeferredDiagnostic: boolean; hasRobustSummary: boolean; hasGeneralizationTraining: boolean;
};
export type ResearchSelectionView = {
  state: string | null; agent: string | null; at: string | null;
  historyCount: number | null; adaptation: string | null;
};
export type ResearchTerminalView = {
  state: string | null; startedAt: string | null; finishedAt: string | null;
  meanAp: number | null; stabilityAp: number | null; largestTrainGap: number | null;
};
export type ResearchStudyView = {
  study: string;
  kinds: Record<"autonomous_run" | "autonomous_result" | "autonomous_selection" | "autonomous_terminal", number>;
  runs: ResearchRunView[];
  results: ResearchResultView[];
  selections: ResearchSelectionView[];
  terminals: ResearchTerminalView[];
  truncated: boolean;
};
export type AutonomousResearchPublication = {
  schemaVersion: "autonomous_research_local_publication_v1";
  generatedAt: string;
  scope: "operator_local_redacted_snapshot_not_a_live_api";
  studyCount: number;
  skippedStudyCount: number;
  containsPartialStudies: boolean;
  aggregateCounts: ResearchStudyView["kinds"];
  studies: ResearchStudyView[];
};

const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 100000;
const nullableCount = (v: unknown) => v === null || count(v);
const nullableBool = (v: unknown) => v === null || typeof v === "boolean";
const nullableText = (v: unknown) => v === null || (typeof v === "string" && v.length <= 140);
const metric = (v: unknown) => v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1);
const keys = ["autonomous_run", "autonomous_result", "autonomous_selection", "autonomous_terminal"] as const;
const counts = (v: unknown): v is ResearchStudyView["kinds"] => obj(v) && keys.every(k => count(v[k]));
const runs = (v: unknown): v is ResearchRunView => obj(v)
  && ["state","agent","recordedAt"].every(k => nullableText(v[k]))
  && ["attempts","completed","failed","remaining","trainedThisRun","cacheHits","llmAccepted","llmRejected","gemmaAccepted","gemmaRejected"].every(k => nullableCount(v[k]))
  && ["pitQualified","performanceApproved","executionAuthorized","independentFuturePerformanceEstablished"].every(k => nullableBool(v[k]));
const results = (v: unknown): v is ResearchResultView => obj(v)
  && ["meanAp","stabilityAp","worstBalancedAccuracy"].every(k => metric(v[k]))
  && nullableCount(v.largestTrainGap)
  && ["pitQualified","performanceApproved","executionAuthorized"].every(k => nullableBool(v[k]))
  && ["hasDeferredDiagnostic","hasRobustSummary","hasGeneralizationTraining"].every(k => typeof v[k] === "boolean");
const selections = (v: unknown): v is ResearchSelectionView => obj(v)
  && ["state","agent","at","adaptation"].every(k => nullableText(v[k]))
  && nullableCount(v.historyCount);
const terminals = (v: unknown): v is ResearchTerminalView => obj(v)
  && ["state","startedAt","finishedAt"].every(k => nullableText(v[k]))
  && ["meanAp","stabilityAp"].every(k => metric(v[k]))
  && nullableCount(v.largestTrainGap);
const arr = (v: unknown, validator: (v: unknown)=>boolean) =>
  Array.isArray(v) && v.length <= 500 && v.every(validator);
function isStudy(v: unknown): v is ResearchStudyView {
  return obj(v) && typeof v.study === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(v.study)
    && counts(v.kinds) && typeof v.truncated === "boolean"
    && arr(v.runs,runs) && arr(v.results,results) && arr(v.selections,selections) && arr(v.terminals,terminals)
    && v.runs.length <= v.kinds.autonomous_run && v.results.length <= v.kinds.autonomous_result
    && v.selections.length <= v.kinds.autonomous_selection && v.terminals.length <= v.kinds.autonomous_terminal;
}

/** Strict local export contract; reject malformed/partial input as a whole. */
export function isAutonomousResearchPublication(v: unknown): v is AutonomousResearchPublication {
  if (!obj(v) || v.schemaVersion !== "autonomous_research_local_publication_v1"
    || v.scope !== "operator_local_redacted_snapshot_not_a_live_api"
    || typeof v.generatedAt !== "string" || v.generatedAt.length > 48 || !Number.isFinite(Date.parse(v.generatedAt))
    || !count(v.studyCount) || v.studyCount > 40 || !count(v.skippedStudyCount)
    || typeof v.containsPartialStudies !== "boolean" || !counts(v.aggregateCounts)
    || !Array.isArray(v.studies) || v.studies.length !== v.studyCount
    || !v.studies.every(isStudy)) return false;
  const names = new Set(v.studies.map(study => study.study));
  if (names.size !== v.studyCount) return false;
  for (const kind of keys) {
    if (v.studies.reduce((sum,study)=>sum+study.kinds[kind],0) !== v.aggregateCounts[kind]) return false;
  }
  if (v.containsPartialStudies !== (v.skippedStudyCount > 0 || v.studies.some(study=>study.truncated))) return false;
  return true;
}

export function researchStudySummary(study: ResearchStudyView) {
  const scores = study.results.map(x=>x.meanAp).filter((v):v is number=>v!==null);
  // Distribution within this one study only, never cross-dataset ranking.
  return {
    meanApObserved: scores.length,
    meanApMin: scores.length ? Math.min(...scores) : null,
    meanApMax: scores.length ? Math.max(...scores) : null,
    completedRuns: study.runs.reduce((sum,run)=>sum+(run.completed??0),0),
    blockedOrFailed: study.runs.reduce((sum,run)=>sum+(run.failed??0),0),
    independentPerformanceEstablished: study.runs.some(run=>run.independentFuturePerformanceEstablished === true),
    anyApproved: study.results.some(result=>result.performanceApproved===true || result.executionAuthorized===true),
  };
}
