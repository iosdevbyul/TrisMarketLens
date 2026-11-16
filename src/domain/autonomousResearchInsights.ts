import type { ResearchResultView, ResearchStudyView } from "./autonomousResearchPublication";

export type EvaluationMetricKey = "meanAp" | "stabilityAp" | "worstBalancedAccuracy";
export const EVALUATION_METRICS: ReadonlyArray<{ key: EvaluationMetricKey; label: string }> = [
  { key: "meanAp", label: "Mean average precision" },
  { key: "stabilityAp", label: "Stability AP" },
  { key: "worstBalancedAccuracy", label: "Worst balanced accuracy" },
];
export type HistogramBucket = { range: string; count: number; lower: number; upper: number };
export type MetricDistribution = {
  observed: number;
  missing: number;
  minimum: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  maximum: number | null;
  buckets: HistogramBucket[];
};
const RANGES = [
  [0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 1],
] as const;

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * p;
  const first = Math.floor(pos);
  const last = Math.ceil(pos);
  return sorted[first] + (sorted[last] - sorted[first]) * (pos - first);
}

/** Distributions are descriptive observations only, never cross-study rankings. */
export function metricDistribution(results: ResearchResultView[], key: EvaluationMetricKey): MetricDistribution {
  const values = results.map(result => result[key]).filter((value): value is number => value !== null).sort((a,b)=>a-b);
  return {
    observed: values.length,
    missing: results.length - values.length,
    minimum: values[0] ?? null,
    q1: percentile(values, .25),
    median: percentile(values, .5),
    q3: percentile(values, .75),
    maximum: values.at(-1) ?? null,
    buckets: RANGES.map(([lower,upper],index) => ({
      lower,upper,
      range: index === 4 ? "0.8–1.0" : `${lower.toFixed(1)}–<${upper.toFixed(1)}`,
      count: values.filter(value => value >= lower && (index === 4 ? value <= upper : value < upper)).length,
    })),
  };
}

export type StudyEvidenceSummary = {
  results: number;
  runRecords: number;
  terminalRecords: number;
  selectionRecords: number;
  terminalStates: { state: string; count: number }[];
  runStates: { state: string; count: number }[];
  approved: number;
  pitQualified: number;
  executionAuthorized: number;
  approvalUnknown: number;
  pitUnknown: number;
  diagnosticPresence: {
    deferred: number; robustness: number; generalization: number;
  };
  complete: boolean;
};
function statuses(rows: Array<{state: string | null}>): {state:string;count:number}[] {
  const counts = new Map<string,number>();
  for (const row of rows) {
    const state = row.state ?? "Unreported";
    counts.set(state,(counts.get(state)??0)+1);
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]))
    .map(([state,count])=>({state,count}));
}
export function summarizeStudyEvidence(study: ResearchStudyView): StudyEvidenceSummary {
  return {
    results: study.results.length,
    runRecords: study.runs.length,
    terminalRecords: study.terminals.length,
    selectionRecords: study.selections.length,
    terminalStates: statuses(study.terminals),
    runStates: statuses(study.runs),
    approved: study.results.filter(result=>result.performanceApproved===true).length,
    pitQualified: study.results.filter(result=>result.pitQualified===true).length,
    executionAuthorized: study.results.filter(result=>result.executionAuthorized===true).length,
    approvalUnknown: study.results.filter(result=>result.performanceApproved===null).length,
    pitUnknown: study.results.filter(result=>result.pitQualified===null).length,
    diagnosticPresence: {
      deferred: study.results.filter(result=>result.hasDeferredDiagnostic).length,
      robustness: study.results.filter(result=>result.hasRobustSummary).length,
      generalization: study.results.filter(result=>result.hasGeneralizationTraining).length,
    },
    complete: !study.truncated
      && study.results.length===study.kinds.autonomous_result
      && study.runs.length===study.kinds.autonomous_run
      && study.terminals.length===study.kinds.autonomous_terminal
      && study.selections.length===study.kinds.autonomous_selection,
  };
}
