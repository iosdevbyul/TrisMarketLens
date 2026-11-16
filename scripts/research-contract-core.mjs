// Pure, operator-safe contract assessments. No network, secrets or writes.
export class ResearchContractError extends Error {
  constructor(stage, reason) {
    super(stage + ": " + reason);
    this.name = "ResearchContractError";
    this.stage = stage;
  }
}
const fail = (stage, reason) => { throw new ResearchContractError(stage, reason); };
const obj = v => !!v && typeof v === "object" && !Array.isArray(v);
const int = (v,min,max) => Number.isSafeInteger(v) && v >= min && v <= max;
const isoDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
  && !Number.isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0,10) === s;
const timestamp = s => typeof s === "string" && /(Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s));
const strings = (v, allowed) => allowed.includes(v);
const nullableTimestamp = s => s === null || timestamp(s);
const nullableDate = s => s === null || isoDate(s);

export function localResearchOrigin(input, management = false) {
  if (typeof input !== "string") return null;
  const match = input.trim().match(/^http:\/\/(127\.0\.0\.1|localhost)(:[0-9]{1,5})?\/?$/);
  if (!match || (management && match[1] !== "127.0.0.1")) return null;
  const port = match[2] ? Number(match[2].slice(1)) : 80;
  if (!int(port,1,65535)) return null;
  return "http://" + match[1] + (match[2] ? ":" + port : "");
}

export function validateHealth(body) {
  if (!obj(body) || body.status !== "ok" || body.service !== "DonghakStockVision" || body.mode !== "read_only")
    fail("health", "Unexpected read-only service contract");
  return { status: "ok" };
}

export function validateResearchPage(body, ticker, limit, offset) {
  const stage = "daily_research";
  if (!obj(body) || body.schemaVersion !== "daily_research_series_v1" || body.ticker !== ticker
    || !int(body.totalRecords,0,100000) || body.limit !== limit || body.offset !== offset
    || !Array.isArray(body.records) || body.records.length > limit || body.records.length > body.totalRecords
    || !strings(body.availability,["recorded","no_recorded_analysis"])
    || body.availability !== (body.totalRecords ? "recorded" : "no_recorded_analysis")
    || body.timestampAuthority !== "local_operational_clock_not_authenticated")
    fail(stage,"Invalid schema, pagination or source authority");

  if (body.records.length !== Math.min(limit,Math.max(0,body.totalRecords-offset)))
    fail(stage,"Incomplete or inconsistent page length");
  const last = [body.lastSuccessfulAnalyzedAt,body.lastSuccessfulTradingDate,body.lastSuccessfulDataOrigin];
  if (last.some(x=>x===null) !== last.every(x=>x===null))
    fail(stage,"Partial last-success metadata");
  if (!nullableTimestamp(last[0]) || !nullableDate(last[1]) || !(last[2]===null||strings(last[2],["real","synthetic_fixture"])))
    fail(stage,"Invalid last-success metadata");
  let previous = null;
  const jobs = new Set();
  const details = {totalRecords:body.totalRecords,offset,limit,previewCount:body.records.length,
    completed:0,pending:0,blocked:0,failed:0,realSource:0,syntheticFixture:0,
    firstDate:null,lastDate:null,jobReferences:[]};
  for (const r of body.records) {
    if (!obj(r) || r.ticker !== ticker || typeof r.jobReference !== "string" || !r.jobReference
      || jobs.has(r.jobReference) || !isoDate(r.tradingDate) || (previous && r.tradingDate > previous))
      fail(stage,"Invalid job identity or trading-date ordering");
    jobs.add(r.jobReference); previous = r.tradingDate;
    if (!strings(r.status,["completed","pending","blocked","failed"])
      || !strings(r.dataOrigin,["real","synthetic_fixture"]) || typeof r.modelId!=="string"
      || !r.modelId || typeof r.modelVersion!=="string" || !r.modelVersion)
      fail(stage,"Invalid research model, status or provenance");
    if (r.performanceApproved!==false || r.forwardPredictionEligible!==false
      || r.executionAuthorized!==false || r.pitQualified!==false
      || r.independentlyAuthenticatedChronology!==false || r.independentlyAuthenticatedCustody!==false)
      fail(stage,"Unexpected prediction or research approval");
    if (r.dataOrigin==="real" ? r.usageRestriction!=="research_only" : r.usageRestriction!=="synthetic_test_only")
      fail(stage,"Provenance and usage restrictions mismatch");
    if (r.status!=="completed" && (r.researchScore!==null || r.researchSignal!=="unavailable"))
      fail(stage,"Unfinished research cannot include an output score or direction");
    if (r.status==="completed" && (typeof r.researchScore!=="number" || !Number.isFinite(r.researchScore)
      || r.researchScore<0 || r.researchScore>1 || !strings(r.researchSignal,["up","down","neutral"])))
      fail(stage,"Completed research output is malformed");
    details[r.status]++;
    if (r.dataOrigin==="real") details.realSource++; else details.syntheticFixture++;
    if (!details.firstDate) details.firstDate=r.tradingDate;
    details.lastDate=r.tradingDate;
    details.jobReferences.push(r.jobReference);
  }
  return details;
}

export function validatePageContinuity(first,second) {
  if (!first || !second || first.totalRecords!==second.totalRecords || second.offset!==first.offset+first.previewCount
    || new Set([...first.jobReferences,...second.jobReferences]).size !== first.previewCount+second.previewCount
    || (first.lastDate && second.firstDate && second.firstDate>first.lastDate))
    fail("pagination","Changed total, noncontiguous page, duplicated job or changed date ordering");
  return true;
}
export function collection(body, keys, stage) {
  const values = Array.isArray(body) ? body : obj(body) ? keys.map(k=>body[k]).find(Array.isArray) : undefined;
  if (!Array.isArray(values) || values.length>100 || values.some(x=>!obj(x)))
    fail(stage,"Invalid or oversized management collection");
  return values;
}
export function validateActive(body) {
  if (!obj(body) || !int(body.selectionVersion,0,1000000000)
    || typeof body.busy!=="boolean"
    || typeof body.selectedModelKey!=="string" || !body.selectedModelKey
    || typeof body.defaultModelKey!=="string" || !body.defaultModelKey)
    fail("management_active","Model selection contract mismatch");
  return {selectionVersion:body.selectionVersion, busy:body.busy,selected:body.selectedModelKey===body.defaultModelKey};
}
export function validateManagement(catalog,active,history,comparisons) {
  const models=collection(catalog,["models","items","entries"],"management_catalog");
  const audits=collection(history,["history","items","entries"],"management_history");
  const studies=collection(comparisons,["comparisons","items","entries"],"management_comparisons");
  const selected=validateActive(active);
  return {registeredModelsReturned:models.length,comparisonRecordsReturned:studies.length,
    historyRecordsReturned:audits.length,selectionVersion:selected.selectionVersion,selectionBusy:selected.busy};
}
