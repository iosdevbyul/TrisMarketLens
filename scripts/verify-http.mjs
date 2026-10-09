const mode = process.env.MARKET_LENS_DATA_SOURCE;
const backendBaseUrl = normalize(process.env.DONGHAK_API_BASE_URL);
const frontendBaseUrl = normalize(
  process.env.MARKET_LENS_URL ?? "http://127.0.0.1:3000",
);

if (mode !== "http") {
  fail("MARKET_LENS_DATA_SOURCE must be http for the real-data E2E check.");
}

if (!backendBaseUrl) {
  fail("DONGHAK_API_BASE_URL is required for the real-data E2E check.");
}

const backendHealth = await getJson(
  backendBaseUrl + "/api/v1/health",
  "DonghakStockVision health",
);
assert(
  backendHealth.status === "ok" &&
    backendHealth.service === "DonghakStockVision" &&
    backendHealth.mode === "read_only",
  "DonghakStockVision health payload does not match the read-only API contract.",
);

const [project, coverage, models, evidence, baseline, stocks] = await Promise.all([
  getJson(backendBaseUrl + "/api/v1/project/status", "project status"),
  getJson(backendBaseUrl + "/api/v1/research/coverage", "coverage"),
  getJson(backendBaseUrl + "/api/v1/models", "models"),
  getJson(backendBaseUrl + "/api/v1/evidence", "evidence"),
  getJson(backendBaseUrl + "/api/v1/backtests/baseline", "baseline"),
  getJson(backendBaseUrl + "/api/v1/stocks", "stocks"),
]);

assert(typeof project.productName === "string", "Project status is missing productName.");
assert(
  Number.isInteger(coverage.universe) && coverage.universe > 0,
  "Coverage universe must be a positive integer.",
);
assert(Array.isArray(models) && models.length > 0, "Models endpoint returned no models.");
assert(
  Array.isArray(evidence) && evidence.length > 0,
  "Evidence endpoint returned no evidence layers.",
);
assert(
  baseline.id === "baseline" && baseline.performanceAvailable === false,
  "Baseline endpoint does not match the blocked pre-performance contract.",
);
assert(Array.isArray(stocks), "Stocks endpoint did not return an array.");
assert(
  stocks.length === coverage.universe,
  `Stock count ${stocks.length} does not match coverage universe ${coverage.universe}.`,
);

if (stocks.length > 0) {
  const firstTicker = stocks[0]?.ticker;
  assert(typeof firstTicker === "string", "First stock record is missing ticker.");
  const detail = await getJson(
    backendBaseUrl + "/api/v1/stocks/" + encodeURIComponent(firstTicker),
    "stock detail",
  );
  assert(detail.ticker === firstTicker, "Stock detail ticker does not match stock summary.");
}

const frontendHealth = await getJson(
  frontendBaseUrl + "/api/health",
  "TrisMarketLens health",
);
assert(
  frontendHealth.status === "ok" &&
    frontendHealth.dataSource === "http" &&
    frontendHealth.backend?.status === "ok",
  "TrisMarketLens is not connected to the healthy HTTP backend.",
);

console.log("Real-data E2E check passed.");
console.log(`Frontend: ${frontendBaseUrl}`);
console.log(`Backend:  ${backendBaseUrl}`);
console.log(`Universe: ${coverage.universe}`);
console.log(`Stocks:   ${stocks.length}`);
console.log(`Models:   ${models.length}`);
console.log(`Evidence: ${evidence.length}`);

function normalize(value) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

async function getJson(url, label) {
  let response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    fail(
      `${label} request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    fail(
      `${label} returned HTTP ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  try {
    return await response.json();
  } catch {
    fail(`${label} returned invalid JSON.`);
  }
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function fail(message) {
  console.error("E2E verification failed:", message);
  process.exit(1);
}
