# TrisMarketLens ↔ DonghakStockVision integration audit

Audited against both repositories' `main` on 2026-10-10. This is a **source-contract review**, not a claim that the backend was started or that live end-to-end integration was executed.

## Executive verdict

**Base research transport is code-compatible and ready for live smoke verification.** The extended AI research and operations screens currently expose frontend-only contracts; they will not show production data without corresponding new backend APIs. A green frontend CI build does not prove cross-repository runtime integration.

## Backend API inventory (verified in `DonghakStockVision/src/donghak_stock_vision/api/app.py`)

| Backend endpoint | Frontend caller | Assessment |
|---|---|---|
| GET /api/v1/health | backendHealth / verify:http | Implemented |
| GET /api/v1/project/status | HttpDataSource.getProjectStatus | Implemented |
| GET /api/v1/research/coverage | HttpDataSource.getCoverageSummary | Implemented |
| GET /api/v1/models | HttpDataSource.getModelSummaries | Implemented |
| GET /api/v1/models/{direction} | HttpDataSource.getModel | Implemented |
| GET /api/v1/evidence | HttpDataSource.getEvidenceLayers | Implemented |
| GET /api/v1/evidence/{layer} | HttpDataSource.getEvidenceLayer | Implemented |
| GET /api/v1/backtests/baseline | HttpDataSource.getBaselineBacktest | Implemented |
| GET /api/v1/stocks | HttpDataSource.getStocks | Implemented |
| GET /api/v1/stocks/{ticker} | HttpDataSource.getStock | Implemented |

Backend Pydantic DTO keys agree with the corresponding front-end TypeScript domain contracts at the route level. A real server and published research snapshot are still required for end-to-end confirmation.

## Frontend-only contracts (NOT present in backend FastAPI routing)

| Frontend environment flag | Proposed endpoint | Owner |
|---|---|---|
| MARKET_LENS_OPERATIONS_SOURCE | GET /api/v1/operations | Backend new read-only operations snapshot |
| MARKET_LENS_OHLCV_SOURCE | GET /api/v1/stocks/{ticker}/ohlcv | Backend new validated OHLCV service |
| MARKET_LENS_STOCK_ANALYSIS_SOURCE | GET /api/v1/stocks/{ticker}/analysis | Backend new model-record service |
| MARKET_LENS_EVALUATION_SOURCE | GET /api/v1/stocks/{ticker}/evaluations | Backend approved evaluation results |
| MARKET_LENS_SCREENER_SOURCE | GET /api/v1/analysis/screener | Backend aggregated research view |
| MARKET_LENS_FRESHNESS_SOURCE | GET /api/v1/operations/freshness | Backend exchange-calendar assessment |
| MARKET_LENS_ALERTS_SOURCE | GET /api/v1/operations/alerts | Backend incident source |

Do not set these flags to `http` in a production deployment until the corresponding backend endpoints exist, have reviewed publication contracts and pass E2E checks. Their default `disconnected` state is expected. `mock` must remain explicitly labeled fictional.

## Integration risks and ownership

1. **Authentication / authorization:** Current FastAPI routing has no authentication dependency for read endpoints, and frontend requests have no Authorization header. The API CLI binds `127.0.0.1:8000` by default. Preserve loopback-only access while local; decide on gateway, authentication, TLS, least-privilege and rate limits **before** external exposure.
2. **CORS:** Backend permits only localhost:3000 and 127.0.0.1:3000 by default. Current server-side Next.js fetch does not depend on browser CORS, but direct browser access or deployed origins need explicit review. CORS is not an authentication mechanism.
3. **Failure handling:** Base `HttpDataSource` uses `cache: "no-store"` and maps detail 404 to null, while non-2xx errors raise `HttpDataSourceError`. Several other specialized adapters fail closed with an inline error and empty data. Unify tracing and presentation at the boundary, but never silently substitute mock on failure.
4. **Response validation:** The base TypeScript `HttpDataSource` performs generic JSON casts, not runtime schema validation; specialized feature adapters do runtime checks. Before production-facing real data, add versioned schema checks / contract tests for core API responses.
5. **Timeouts:** Feature adapters use five-second AbortSignal timeout; the base `HttpDataSource` currently lacks a configured fetch timeout. Add a bounded timeout and test it as a separate code change.
6. **Freshness semantics:** Backend determines KRX sessions/holidays, data completeness and model policy. UI must only display reported evidence. Do not infer healthy state, predictive success or market readiness.
7. **Snapshot publication:** DonghakStockVision's API reads an explicit immutable research snapshot. The exporter is not invoked by an HTTP request. API health `ok` does not independently establish that the snapshot is fresh.
8. **Mock-by-default:** `MARKET_LENS_DATA_SOURCE` defaults to `mock`, whereas specialized feature adapters default to `disconnected`. Explicitly configure flags during each environment verification; avoid confusing mock UI with live backend state.
9. **Scope:** No backend endpoints, authentication changes or live runtime activity have been performed as part of this audit.

## Suggested delivery order

**P0 – establish currently implemented baseline:** Produce a reviewed immutable backend snapshot, start loopback FastAPI, launch frontend with `MARKET_LENS_DATA_SOURCE=http`, run the existing `npm run verify:http`, then verify individual model/evidence/stock detail views. Confirm API 404/503 and unavailable reader behavior.

**P1 – transport hardening:** Add timeout and runtime contract validation to base HttpDataSource, establish explicit access/authentication policy and nonlocal deployment configuration, add cross-repository contract/E2E CI against deterministic sample snapshots.

**P2 – unlock high-value research views:** Backend OHLCV; individual stock analysis records; aggregated Screener. Define stable IDs, model provenance, analysis date vs data-through date and policy lifecycle explicitly.

**P3 – evaluation:** Add backend-produced prediction evaluations only after approved evaluation rules and validated inputs exist. Do not derive verdicts in the web app.

**P4 – operations:** Publish read-only operations events, exchange-calendar freshness assessment and alerts. Specify pipeline-stage identities, timestamp semantics and freshness SLA. Consider authentication before exposure.

## Local real-API validation (manual)

From DonghakStockVision repository:

```bash
python -m pip install -e '.[api]'
dsv-api-export --root . --market-db .data/market.sqlite3 --output .data/research-api-snapshot.json
dsv-api --snapshot .data/research-api-snapshot.json
```

The exporter validates committed artifact fingerprints and refuses invalid inputs or overwrite; use a fresh output path when one already exists. This does not run model inference or backtests.

From TrisMarketLens, configure `.env.local`:

```dotenv
MARKET_LENS_DATA_SOURCE=http
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
MARKET_LENS_URL=http://127.0.0.1:3000
```

All seven extension source flags should remain `disconnected` until their backend APIs exist.

```bash
npm ci
npm run dev
# In a second terminal:
npm run verify:http
```

**Exit criterion:** verifier prints `Real-data E2E check passed.`, and the UI shows corresponding real-reviewed coverage, model, evidence and stock records. The verification script currently checks backend health, project, coverage, models, evidence, baseline, stock universe/count, one ticker detail and frontend health; it does not exercise future extension endpoints.

## Evidence anchors

- DonghakStockVision: `src/donghak_stock_vision/api/app.py`, `api/models.py`, `api_cli.py`, `docs/research-api.md`.
- TrisMarketLens: `src/data/HttpDataSource.ts`, `src/data/getDataSource.ts`, `src/data/backendHealth.ts`, feature data adapters, `scripts/verify-http.mjs`, `docs/http-api-contract.md` and `.env.example`.
