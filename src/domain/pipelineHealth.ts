import type { AnalysisRun, OperationsSnapshot } from "./operations";

export const PIPELINE_STAGES = ["collection", "validation", "inference"] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];
export type StageStatus = "succeeded" | "failed" | "blocked" | "running" | "queued" | "unknown";
export interface PipelineHealthStage {
  stage: PipelineStage;
  state: StageStatus;
  latestRun: AnalysisRun | null;
  latestSuccessAt: string | null;
  latestSuccessDataThrough: string | null;
}
export interface PipelineHealthSummary {
  stages: PipelineHealthStage[];
  checkedAt: string | null;
  latestValidatedData: string | null;
  state: "unknown" | "attention" | "active" | "reported_success";
}
/** Stage classification is an explicit naming contract; unknown pipelines are not guessed. */
export function classifyPipeline(name: string): PipelineStage | null {
  const normalized=name.trim().toLowerCase();
  if (normalized === "market collection" || normalized === "daily market collection" || normalized === "data collection") return "collection";
  if (normalized === "market validation" || normalized === "daily market validation" || normalized === "data validation") return "validation";
  if (normalized === "model inference" || normalized === "daily model inference") return "inference";
  return null;
}
function runSortTime(run:AnalysisRun):number {
  const date=run.startedAt ?? run.finishedAt;
  return date === null ? -1 : Date.parse(date);
}
export function derivePipelineHealth(snapshot:OperationsSnapshot):PipelineHealthSummary {
  const stages=PIPELINE_STAGES.map(stage=>{
    const runs=snapshot.runs.filter(run=>classifyPipeline(run.pipeline)===stage);
    const ranked=[...runs].sort((a,b)=>runSortTime(b)-runSortTime(a)||b.id.localeCompare(a.id));
    const latestRun=ranked[0]??null;
    const successful=runs.filter(run=>run.state==="succeeded"&&run.finishedAt!==null).sort((a,b)=>Date.parse(b.finishedAt!)-Date.parse(a.finishedAt!))[0]??null;
    return {stage,state:latestRun?.state??"unknown",latestRun,latestSuccessAt:successful?.finishedAt??null,latestSuccessDataThrough:successful?.dataThrough??null};
  });
  const state = snapshot.connection!=="connected" ? "unknown"
    : stages.some(stage=>stage.state==="failed"||stage.state==="blocked") ? "attention"
    : stages.some(stage=>stage.state==="running"||stage.state==="queued") ? "active"
    : stages.every(stage=>stage.state==="succeeded") ? "reported_success" : "unknown";
  return {stages,checkedAt:snapshot.checkedAt,latestValidatedData:snapshot.latestDataThrough,state};
}
