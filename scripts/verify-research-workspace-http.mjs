// Operator-only, read-only. Nothing here configures, starts or mutates the backend.
import {
  ResearchContractError, localResearchOrigin, validateHealth, validateResearchPage,
  validatePageContinuity, validateManagement,
} from "./research-contract-core.mjs";

const ticker = (process.env.MARKET_LENS_VERIFY_TICKER ?? "").trim().toUpperCase();
const backend = localResearchOrigin(process.env.DONGHAK_API_BASE_URL);
const managementOrigin = process.env.DONGHAK_AI_MANAGEMENT_BASE_URL;
const token = process.env.DONGHAK_AI_MANAGEMENT_TOKEN;

async function read(origin, path, credential, stage) {
  let response;
  try {
    response = await fetch(origin + path, {
      headers: {Accept:"application/json",...(credential?{Authorization:"Bearer "+credential}:{})},
      redirect:"error", cache:"no-store", signal:AbortSignal.timeout(5000),
    });
  } catch { throw new ResearchContractError(stage,"Local source unreachable, timed out or redirected"); }
  if (!response.ok) {
    const label = response.status===401 ? "Authentication rejected" : response.status===403
      ? "Insufficient read permission" : response.status===503 ? "Publication not configured" : "HTTP "+response.status;
    throw new ResearchContractError(stage,label);
  }
  try { return await response.json(); }
  catch { throw new ResearchContractError(stage,"Invalid JSON response"); }
}

async function verify() {
  if (process.env.MARKET_LENS_DATA_SOURCE!=="http")
    throw new ResearchContractError("configuration","MARKET_LENS_DATA_SOURCE must be http");
  if (!/^[0-9A-Z]{6}$/.test(ticker))
    throw new ResearchContractError("configuration","MARKET_LENS_VERIFY_TICKER must be six characters");
  if (!backend)
    throw new ResearchContractError("configuration","DONGHAK_API_BASE_URL must be a local loopback HTTP origin");

  validateHealth(await read(backend,"/api/v1/health",null,"health"));
  const first = validateResearchPage(
    await read(backend,"/api/v1/stocks/"+ticker+"/research-analysis?limit=10&offset=0",null,"daily_research"),
    ticker,10,0,
  );
  let second = null;
  // The second page is checked only if it exists. No more than two pages are fetched.
  if (first.totalRecords > first.previewCount) {
    const limit = 10;
    second = validateResearchPage(
      await read(backend,"/api/v1/stocks/"+ticker+"/research-analysis?limit="+limit+"&offset=10",null,"pagination"),
      ticker,limit,10,
    );
    validatePageContinuity(first,second);
  }

  let management = {status:"not_configured",registeredModelsReturned:null,comparisonRecordsReturned:null,
    historyRecordsReturned:null,selectionVersion:null,selectionBusy:null};
  if (managementOrigin || token) {
    const origin = localResearchOrigin(managementOrigin,true);
    if (!origin || typeof token!=="string" || !token.trim())
      throw new ResearchContractError("configuration","Management requires a literal 127.0.0.1 HTTP origin and server-only token");
    const [catalog,active,history,comparisons] = await Promise.all([
      read(origin,"/api/v1/ai/models",token,"management_catalog"),
      read(origin,"/api/v1/ai/models/active",token,"management_active"),
      read(origin,"/api/v1/ai/models/history",token,"management_history"),
      read(origin,"/api/v1/ai/models/comparisons",token,"management_comparisons"),
    ]);
    management = {status:"authenticated_read_only",...validateManagement(catalog,active,history,comparisons)};
  }
  return {
    outcome:"passed",scope:"read_only_contract_check",ticker,
    backend:"healthy_read_only",dailyResearch:{
      publishedTotal:first.totalRecords,
      checkedPages:second?2:1, checkedRecords:first.previewCount+(second?.previewCount??0),
      previewCount:first.previewCount,previewCompleted:first.completed,
      previewPending:first.pending,previewBlocked:first.blocked,previewFailed:first.failed,
      previewReal:first.realSource,previewSynthetic:first.syntheticFixture,
    },management,
    caveat:"This check cannot certify data freshness, PIT, Final Test qualification, profit, forecast accuracy or trading permission.",
  };
}

try {
  const report = await verify();
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
} catch(error) {
  // No endpoint URL, bearer token, raw HTTP body or research record is printed.
  const stage = error instanceof ResearchContractError ? error.stage : "unexpected";
  const reason = error instanceof ResearchContractError ? error.message.slice(stage.length+2) : "Internal verifier error";
  process.stderr.write(JSON.stringify({outcome:"failed",stage,reason})+"\n");
  process.exitCode = 1;
}
