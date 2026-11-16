import "server-only";
import { normalizeLocalBackendUrl } from "./localBackendUrl";

const prefix = "/api/v1/research/lab";
const HASH = /^[a-f0-9]{64}$/;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const nonNegative = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const metric = (v: unknown): v is number | null => v === null || (typeof v === "number" && Number.isFinite(v));
const text = (v: unknown): v is string => typeof v === "string" && v.length <= 256;
const maybeText = (v: unknown): v is string | null => v === null || text(v);

export type ResearchLabHorizon = {
  horizon: number; experimentCount: number; selectedExperimentId: string | null;
  selectedMeanAP: number | null; bestSeenAP: number | null;
  selectedSeenFoldMetrics: Array<Record<string, number | null> | null>;
  selectedDeferredDiagnostic: unknown;
  selectionUsesDeferredDiagnostic: false;
};
export type ResearchLabStudy = {
  studyId: string; reportId: string; cohort: string;
  selectionPolicy: "adaptive" | "predeclared" | "robust";
  experimentBudget: number; completed: number; failed: number;
  comparisonGroupId: string; horizons: ResearchLabHorizon[];
  researchOnly: true; locked: true;
  independentValidationStatus: "NOT_ESTABLISHED";
  pitQualified: false; performanceApproved: false; executionAuthorized: false;
};
export type ResearchLabExperiment = {
  studyId: string; experimentId: string; reportId: string;
  status: string; horizon: number; modelFamily: string;
  stockPolicy?: string; parentExperimentId: string | null;
  meanAP?: number | null; stabilityAP?: number | null; largestTrainGap?: number | null;
  selectedForHorizon: boolean;
  seenFoldMetrics: Array<Record<string, number | null> | null>;
  seenFoldBaselines: Array<Record<string, Record<string, number | null> | null>>;
  deferredDiagnostic: unknown; robustSummary: Record<string, unknown> | null;
  comparisonQualification: "DESCRIPTIVE_RESEARCH_ONLY";
  [key: string]: unknown;
};
export type ResearchLabMemory = {
  schemaVersion: "research_lab_memory_v1"; studyId: string;
  memoryChangedChoices: number | null;
  interpretation: "HISTORICAL_SEARCH_ONLY_NOT_CAUSAL_LLM_EVIDENCE";
  events: Array<{ experimentId: string; selectionOrder: number | null; cacheReused: boolean | null; parentExperimentId: string | null }>;
};
export type ResearchLabReport = ResearchLabStudy & {
  researchPeriod: { first_date: string; last_date: string; dates: number; observations: number };
  sourceClass: "ARCHIVED_KRX_RESEARCH_NOT_INDEPENDENT_PIT";
  memoryChangedChoices: number | null; cacheHits: number | null;
  learnerSeconds: number | null; maximumRssKb: number | null;
  discoveryCurve: Array<{ experimentId: string; selection: number | null; cacheReused: boolean | null }>;
  limitations: string[];
};
export type ResearchLabComparison = {
  comparisonGroupId: string; cohort: string; policies: string[];
  completeThreeArmComparison: boolean; policySuperiorityEstablished: false;
  conclusionStatus: "DESCRIPTIVE_ONLY_NOT_INDEPENDENT";
  horizons: Array<{ horizon: number; arms: Array<{ studyId: string; policy: string } & ResearchLabHorizon> }>;
};
export type LabPage<T> = { total: number; offset: number; limit: number; items: T[]; schemaVersion: string };
export type LabLoad<T> = { data: T | null; state: "available" | "disabled" | "unavailable" | "invalid" | "not_found"; message: string };

function validHorizon(v: unknown): v is ResearchLabHorizon {
  return isObject(v) && nonNegative(v.horizon) && nonNegative(v.experimentCount) &&
    maybeText(v.selectedExperimentId) && (v.selectedExperimentId === null || HASH.test(v.selectedExperimentId)) &&
    metric(v.selectedMeanAP) && metric(v.bestSeenAP) &&
    Array.isArray(v.selectedSeenFoldMetrics) && v.selectedSeenFoldMetrics.length <= 100 &&
    v.selectionUsesDeferredDiagnostic === false;
}
function validStudy(v: unknown): v is ResearchLabStudy {
  return isObject(v) && typeof v.studyId === "string" && HASH.test(v.studyId) &&
    typeof v.reportId === "string" && HASH.test(v.reportId) &&
    text(v.cohort) && typeof v.comparisonGroupId === "string" && HASH.test(v.comparisonGroupId) &&
    ["adaptive","predeclared","robust"].includes(String(v.selectionPolicy)) &&
    nonNegative(v.experimentBudget) && nonNegative(v.completed) && nonNegative(v.failed) &&
    (v.completed as number) + (v.failed as number) === v.experimentBudget &&
    Array.isArray(v.horizons) && v.horizons.length <= 30 && v.horizons.every(validHorizon) &&
    v.researchOnly === true && v.locked === true &&
    v.independentValidationStatus === "NOT_ESTABLISHED" &&
    v.pitQualified === false && v.performanceApproved === false && v.executionAuthorized === false;
}
function validExperiment(v: unknown): v is ResearchLabExperiment {
  return isObject(v) && typeof v.experimentId === "string" && HASH.test(v.experimentId) &&
    typeof v.studyId === "string" && HASH.test(v.studyId) &&
    typeof v.reportId === "string" && HASH.test(v.reportId) &&
    text(v.status) && nonNegative(v.horizon) &&
    (typeof v.modelFamily === "string" || isObject(v.config)) &&
    (v.parentExperimentId === null || (typeof v.parentExperimentId === "string" && HASH.test(v.parentExperimentId))) &&
    v.selectedForHorizon !== undefined && typeof v.selectedForHorizon === "boolean" &&
    Array.isArray(v.seenFoldMetrics) && Array.isArray(v.seenFoldBaselines) &&
    v.seenFoldMetrics.length <= 100 && v.seenFoldBaselines.length <= 100 &&
    v.comparisonQualification === "DESCRIPTIVE_RESEARCH_ONLY";
}
function validMemory(v: unknown): v is ResearchLabMemory {
  return isObject(v) && v.schemaVersion === "research_lab_memory_v1" &&
    typeof v.studyId === "string" && HASH.test(v.studyId) &&
    v.interpretation === "HISTORICAL_SEARCH_ONLY_NOT_CAUSAL_LLM_EVIDENCE" &&
    (v.memoryChangedChoices === null || nonNegative(v.memoryChangedChoices)) &&
    Array.isArray(v.events) && v.events.length <= 1000 &&
    v.events.every((e: unknown) => isObject(e) && typeof e.experimentId === "string" &&
      HASH.test(e.experimentId) && (e.parentExperimentId === null || (typeof e.parentExperimentId === "string" && HASH.test(e.parentExperimentId))));
}
function validReport(v: unknown): v is ResearchLabReport {
  return validStudy(v) && isObject(v) && isObject(v.researchPeriod) &&
    v.sourceClass === "ARCHIVED_KRX_RESEARCH_NOT_INDEPENDENT_PIT" &&
    Array.isArray(v.discoveryCurve) && v.discoveryCurve.length <= 1000 &&
    Array.isArray(v.limitations) && v.limitations.every(text);
}
function validComparison(v: unknown): v is ResearchLabComparison {
  return isObject(v) && typeof v.comparisonGroupId === "string" && HASH.test(v.comparisonGroupId) &&
    text(v.cohort) && Array.isArray(v.policies) &&
    v.policies.every((p: unknown) => ["adaptive","predeclared","robust"].includes(String(p))) &&
    typeof v.completeThreeArmComparison === "boolean" &&
    v.policySuperiorityEstablished === false &&
    v.conclusionStatus === "DESCRIPTIVE_ONLY_NOT_INDEPENDENT" &&
    Array.isArray(v.horizons) && v.horizons.length <= 30 &&
    v.horizons.every((h: unknown) => isObject(h) && nonNegative(h.horizon) &&
      Array.isArray(h.arms) && h.arms.length <= 3 &&
      h.arms.every((a: unknown) => isObject(a) && typeof a.studyId === "string" &&
        HASH.test(a.studyId) && ["adaptive","predeclared","robust"].includes(String(a.policy)) && validHorizon(a)));
}
function validPage<T>(v: unknown, version: string, offset: number, limit: number, valid: (x: unknown) => x is T): v is LabPage<T> {
  return isObject(v) && v.schemaVersion === version && v.offset === offset && v.limit === limit &&
    nonNegative(v.total) && Array.isArray(v.items) && v.items.length <= limit &&
    v.items.length <= Math.max(0, (v.total as number) - offset) && v.items.every(valid);
}
type RequestOptions = { apiBaseUrl?: string; fetcher?: typeof fetch; enabled?: boolean };
async function request<T>(suffix: string, valid: (v: unknown) => v is T, options: RequestOptions = {}): Promise<LabLoad<T>> {
  const empty = (state: LabLoad<T>["state"], message: string): LabLoad<T> => ({data:null,state,message});
  if (options.enabled === false) return empty("disabled","Local Research Lab API is not enabled.");
  const base = normalizeLocalBackendUrl(options.apiBaseUrl ?? process.env.DONGHAK_API_BASE_URL);
  if (!base) return empty("disabled","The approved Research Lab requires an explicitly configured local loopback backend.");
  try {
    const response = await (options.fetcher ?? fetch)(base + prefix + suffix, {
      headers: {Accept:"application/json"}, cache:"no-store",
      redirect:"error", signal:AbortSignal.timeout(5000),
    });
    if (response.status === 404) return empty("not_found","The requested Research Lab record was not published.");
    if (response.status === 403) return empty("unavailable","The Research Lab is restricted to the approved local operator.");
    if (response.status === 503) return empty("unavailable","An approved Research Lab snapshot is not configured on the local backend.");
    if (!response.ok) return empty("unavailable","Research Lab API returned HTTP " + response.status + ".");
    const raw: unknown = await response.json();
    if (!valid(raw)) return empty("invalid","Research Lab API returned an unsupported or inconsistent publication contract.");
    return {data:raw,state:"available",message:"Approved local Research Lab publication loaded (research-only)."};
  } catch {
    return empty("unavailable","The approved local Research Lab API is unreachable or returned invalid JSON.");
  }
}
function validId(id: string): boolean {return HASH.test(id);}
export function labStudies(offset=0,limit=25,options:RequestOptions={}):Promise<LabLoad<LabPage<ResearchLabStudy>>> {
  if (!nonNegative(offset) || !Number.isInteger(limit) || limit<1 || limit>100) return Promise.resolve({data:null,state:"invalid",message:"Invalid pagination."});
  return request("/studies?offset="+offset+"&limit="+limit,v=>validPage(v,"research_lab_studies_v1",offset,limit,validStudy),options);
}
export function labStudy(id:string,options:RequestOptions={}):Promise<LabLoad<ResearchLabStudy>> {
  if(!validId(id))return Promise.resolve({data:null,state:"not_found",message:"Invalid Study ID."});
  return request("/studies/"+id,validStudy,options).then(r=>r.data && r.data.studyId!==id?{data:null,state:"invalid",message:"Study ID mismatch."}:r);
}
export function labExperiments(id:string,offset=0,limit=25,options:RequestOptions={}):Promise<LabLoad<LabPage<ResearchLabExperiment>>> {
  if(!validId(id)||!nonNegative(offset)||!Number.isInteger(limit)||limit<1||limit>100)return Promise.resolve({data:null,state:"invalid",message:"Invalid experiment request."});
  return request("/studies/"+id+"/experiments?offset="+offset+"&limit="+limit,v=>validPage(v,"research_lab_experiments_v1",offset,limit,validExperiment),options)
    .then(r=>r.data?.items.every(x=>x.studyId===id)?r:r.data?{data:null,state:"invalid",message:"Experiment owner mismatch."}:r);
}
export function labExperiment(id:string,experimentId:string,options:RequestOptions={}):Promise<LabLoad<ResearchLabExperiment>> {
  if(!validId(id)||!validId(experimentId))return Promise.resolve({data:null,state:"not_found",message:"Invalid Experiment ID."});
  return request("/studies/"+id+"/experiments/"+experimentId,validExperiment,options)
    .then(r=>r.data && (r.data.studyId!==id||r.data.experimentId!==experimentId)?{data:null,state:"invalid",message:"Experiment ID mismatch."}:r);
}
export function labMemory(id:string,options:RequestOptions={}):Promise<LabLoad<ResearchLabMemory>> {
  if(!validId(id))return Promise.resolve({data:null,state:"not_found",message:"Invalid Study ID."});
  return request("/studies/"+id+"/memory",validMemory,options)
    .then(r=>r.data && r.data.studyId!==id?{data:null,state:"invalid",message:"Memory Study ID mismatch."}:r);
}
export function labReports(offset=0,limit=25,options:RequestOptions={}):Promise<LabLoad<LabPage<ResearchLabStudy>>> {
  if(!nonNegative(offset)||!Number.isInteger(limit)||limit<1||limit>100)return Promise.resolve({data:null,state:"invalid",message:"Invalid report pagination."});
  return request("/reports?offset="+offset+"&limit="+limit,v=>validPage(v,"research_lab_reports_v1",offset,limit,validStudy),options);
}
export function labReport(id:string,options:RequestOptions={}):Promise<LabLoad<ResearchLabReport>> {
  if(!validId(id))return Promise.resolve({data:null,state:"not_found",message:"Invalid Report ID."});
  return request("/reports/"+id,validReport,options)
    .then(r=>r.data && r.data.reportId!==id?{data:null,state:"invalid",message:"Report ID mismatch."}:r);
}
export function labComparisons(options:RequestOptions={}):Promise<LabLoad<{schemaVersion:"research_lab_comparisons_v1";items:ResearchLabComparison[]}>> {
  return request("/comparisons", (v):v is {schemaVersion:"research_lab_comparisons_v1";items:ResearchLabComparison[]} =>
    isObject(v)&&v.schemaVersion==="research_lab_comparisons_v1"&&Array.isArray(v.items)&&v.items.length<=50&&v.items.every(validComparison),options);
}
