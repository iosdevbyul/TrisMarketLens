/**
 * Operator-only smoke verification of the approved six-study Research Lab publication.
 * Read-only GET requests to explicit loopback backend. No data exports or writes.
 */
const prefix = "/api/v1/research/lab";
const hash = /^[a-f0-9]{64}$/;
const value = (condition, message) => {
  if (!condition) throw new Error(message);
};
const rawBase = process.env.DONGHAK_API_BASE_URL?.trim();
value(rawBase && /^http:\/\/(127\.0\.0\.1|localhost)(:[0-9]{1,5})?\/?$/.test(rawBase),
  "DONGHAK_API_BASE_URL must be an explicit loopback HTTP origin");
const url = new URL(rawBase);
value(!url.username && !url.password && !url.search && !url.hash && url.pathname === "/",
  "Research Lab verifier rejects URL credentials and paths");
const port = url.port ? Number(url.port) : 80;
value(port >= 1 && port <= 65535, "Invalid backend port");
const origin = url.origin;

async function get(path) {
  const response = await fetch(origin + prefix + path, {
    headers: { Accept: "application/json" },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  value(response.ok, `Research Lab HTTP ${response.status} for ${path.split("?")[0]}`);
  return response.json();
}

const studies = await get("/studies?offset=0&limit=25");
value(studies.schemaVersion === "research_lab_studies_v1" && studies.total === 6 &&
  studies.items?.length === 6, "Expected six approved Study records");
value(new Set(studies.items.map(s => s.studyId)).size === 6, "Duplicate Study IDs");
const reports = await get("/reports?offset=0&limit=25");
value(reports.schemaVersion === "research_lab_reports_v1" && reports.total === 6 &&
  reports.items?.length === 6, "Expected six final reports");
const comparisons = await get("/comparisons");
value(comparisons.schemaVersion === "research_lab_comparisons_v1" &&
  Array.isArray(comparisons.items) && comparisons.items.length === 2 &&
  comparisons.items.every(c => c.completeThreeArmComparison &&
    c.policySuperiorityEstablished === false),
  "Cohort-matched comparisons not available or invalid");

const reportIds = new Set(reports.items.map(s => s.reportId));
let experimentCount = 0;
let memoryEventCount = 0;
for (const study of studies.items) {
  value(hash.test(study.studyId) && hash.test(study.reportId) &&
    reportIds.has(study.reportId) && study.completed === 12 && study.failed === 0 &&
    study.researchOnly === true && study.locked === true &&
    study.independentValidationStatus === "NOT_ESTABLISHED" &&
    study.performanceApproved === false && study.executionAuthorized === false,
  "Study identity or qualification policy mismatch");
  const id = study.studyId;
  const [detail, experiments, memory, report] = await Promise.all([
    get("/studies/" + id),
    get("/studies/" + id + "/experiments?offset=0&limit=25"),
    get("/studies/" + id + "/memory"),
    get("/reports/" + study.reportId),
  ]);
  value(detail.studyId === id && detail.reportId === study.reportId,
    "Study detail identity mismatch");
  value(experiments.schemaVersion === "research_lab_experiments_v1" &&
    experiments.total === 12 && experiments.items?.length === 12 &&
    experiments.items.every(e => hash.test(e.experimentId) && e.studyId === id),
  "Experiment catalog identity mismatch");
  const experimentIds = experiments.items.map(e => e.experimentId);
  value(new Set(experimentIds).size === 12, "Duplicate Experiment IDs within Study");
  const selected = experiments.items.find(e => e.selectedForHorizon);
  value(selected && hash.test(selected.experimentId), "Missing selected Experiment");
  const experiment = await get("/studies/" + id + "/experiments/" + selected.experimentId);
  value(experiment.studyId === id && experiment.experimentId === selected.experimentId &&
    experiment.comparisonQualification === "DESCRIPTIVE_RESEARCH_ONLY",
    "Selected Experiment evidence mismatch");
  value(memory.schemaVersion === "research_lab_memory_v1" && memory.studyId === id &&
    Array.isArray(memory.events) &&
    memory.events.every(e => experimentIds.includes(e.experimentId)),
    "Experiment Memory identity mismatch");
  value(report.reportId === study.reportId && report.studyId === id &&
    report.sourceClass === "ARCHIVED_KRX_RESEARCH_NOT_INDEPENDENT_PIT",
    "Report provenance mismatch");
  experimentCount += experiments.total;
  memoryEventCount += memory.events.length;
}
value(experimentCount === 72, "Expected 72 original Experiment records");
console.log(JSON.stringify({
  status: "RESEARCH_LAB_READ_ONLY_HTTP_VERIFIED",
  studies: studies.total,
  completedExperiments: experimentCount,
  finalReports: reports.total,
  matchedComparisonGroups: comparisons.items.length,
  memoryEvents: memoryEventCount,
  independentlyValidated: false,
  performanceApproved: false,
  executionAuthorized: false,
}, null, 2));
