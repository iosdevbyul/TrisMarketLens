// Operator-only, read-only integration verifier for the actual research publication.
// This script never validates/selects models, runs research, collects data or modifies the backend.
const mode = process.env.MARKET_LENS_DATA_SOURCE;
const ticker = (process.env.MARKET_LENS_VERIFY_TICKER ?? "").trim().toUpperCase();

function localOrigin(value) {
  const source = value?.trim();
  if (!source || !/^http:\/\/(127\.0\.0\.1|localhost)(:[0-9]{1,5})?\/?$/.test(source)) return null;
  try {
    const url = new URL(source);
    const port = url.port ? Number(url.port) : 80;
    return port >= 1 && port <= 65535 && url.pathname === "/" && !url.search && !url.hash ? url.origin : null;
  } catch { return null; }
}

function check(value, message) {
  if (!value) throw new Error(message);
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function list(value, keys) {
  const values = Array.isArray(value) ? value : keys.map(key => value?.[key]).find(Array.isArray);
  check(Array.isArray(values), "Management collection does not match the web-adapter contract");
  return values;
}
async function read(origin, path, token) {
  const response = await fetch(origin + path, {
    headers: { Accept: "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
  });
  check(response.ok, path + " returned HTTP " + response.status);
  return response.json();
}

check(mode === "http", "Set MARKET_LENS_DATA_SOURCE=http to verify live publication");
check(/^[0-9A-Z]{6}$/.test(ticker), "Set MARKET_LENS_VERIFY_TICKER to a six-character ticker");
const backend = localOrigin(process.env.DONGHAK_API_BASE_URL);
check(backend, "DONGHAK_API_BASE_URL must be a local loopback HTTP origin");
const health = await read(backend, "/api/v1/health");
check(health?.status === "ok" && health?.service === "DonghakStockVision" && health?.mode === "read_only", "Read-only backend health contract mismatch");

const daily = await read(backend, "/api/v1/stocks/" + encodeURIComponent(ticker) + "/research-analysis?limit=10&offset=0");
check(object(daily) && daily.schemaVersion === "daily_research_series_v1", "Daily research schemaVersion mismatch");
check(daily.ticker === ticker && Array.isArray(daily.records) && daily.records.length <= 10, "Daily research ticker or bounded preview mismatch");
check(daily.offset === 0 && daily.limit === 10 && Number.isSafeInteger(daily.totalRecords) && daily.totalRecords >= daily.records.length, "Daily research pagination contract mismatch");
check(daily.availability === (daily.totalRecords > 0 ? "recorded" : "no_recorded_analysis"), "Daily research availability mismatch");
check(daily.timestampAuthority === "local_operational_clock_not_authenticated", "Unexpected timestamp authority");
let previousDate = null;
const seenJobs = new Set();
for (const entry of daily.records) {
  check(object(entry) && entry.ticker === ticker && typeof entry.jobReference === "string" && entry.jobReference.length > 0 && !seenJobs.has(entry.jobReference), "Daily research record identity invalid");
  seenJobs.add(entry.jobReference);
  check(/^\d{4}-\d{2}-\d{2}$/.test(entry.tradingDate) && (!previousDate || entry.tradingDate <= previousDate), "Daily research order mismatch");
  previousDate = entry.tradingDate;
  check(["real", "synthetic_fixture"].includes(entry.dataOrigin) && ["completed", "blocked", "failed", "pending"].includes(entry.status), "Daily research source/status invalid");
  check(entry.performanceApproved === false && entry.forwardPredictionEligible === false &&
    entry.executionAuthorized === false && entry.pitQualified === false, "Unexpected approval/permission claim");
  check(entry.dataOrigin === "real" ? entry.usageRestriction === "research_only" : entry.usageRestriction === "synthetic_test_only", "Daily research origin/usage mismatch");
}

const managementEnv = process.env.DONGHAK_AI_MANAGEMENT_BASE_URL;
const token = process.env.DONGHAK_AI_MANAGEMENT_TOKEN;
let managementStatus = "not_configured";
let modelCount = null;
let comparisonCount = null;
if (managementEnv || token) {
  const origin = localOrigin(managementEnv);
  check(origin && origin.startsWith("http://127.0.0.1"), "Management endpoint must be literal 127.0.0.1 loopback origin");
  check(typeof token === "string" && token.trim(), "Set a server-only management read credential");
  const [catalog, active, comparison, history] = await Promise.all([
    read(origin, "/api/v1/ai/models", token),
    read(origin, "/api/v1/ai/models/active", token),
    read(origin, "/api/v1/ai/models/comparisons", token),
    read(origin, "/api/v1/ai/models/history", token),
  ]);
  check(object(catalog) && object(active), "Management catalog/selection contract mismatch");
  modelCount = list(catalog, ["models", "items", "entries"]).length;
  comparisonCount = list(comparison, ["comparisons", "items", "entries"]).length;
  list(history, ["history", "items", "entries"]);
  check(Number.isSafeInteger(active.selectionVersion) && active.selectionVersion >= 0, "Management selection version unavailable");
  managementStatus = "authenticated_read_only";
}

// Only nonsecret aggregated information is emitted. Never log the URL credentials,
// authorization header, private response body, full records or tokens.
console.log(JSON.stringify({
  status: "verified_read_only_publication",
  ticker,
  backend: "healthy_read_only",
  dailyResearch: {
    publishedTotal: daily.totalRecords, previewCount: daily.records.length,
    realSource: daily.records.filter(x => x.dataOrigin === "real").length,
    syntheticFixture: daily.records.filter(x => x.dataOrigin === "synthetic_fixture").length,
    completed: daily.records.filter(x => x.status === "completed").length,
  },
  management: { status: managementStatus, registeredModelsReturned: modelCount, comparisonRecordsReturned: comparisonCount },
  caveat: "A successful HTTP contract check does not establish data freshness, experiment quality, price prediction accuracy or trading approval.",
}, null, 2));
