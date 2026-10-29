# Backend API integration gap audit — 2026-10-30

## Scope and evidence

Source-code review of the `main` branches of `iosdevbyul/TrisMarketLens` and `iosdevbyul/DonghakStockVision` on 2026-10-30. This document supersedes the endpoint inventory (not the historical record) in `backend-integration-audit.md` dated 2026-10-10.

**This is a static contract comparison.** It does not establish local server availability, a valid published snapshot, fresh production data, browser rendering, or successful cross-repository E2E tests. No live KRX or broker request is needed for this review.

## Confirmed routes in the backend FastAPI app

Backend source: `src/donghak_stock_vision/api/app.py`. Frontend adapters are under `src/data/`.

| Backend GET route | Frontend integration | Static assessment |
| --- | --- | --- |
| `/api/v1/health` | `backendHealth`, `verify:http` | Matching route |
| `/api/v1/project/status` | `HttpDataSource` | Matching route |
| `/api/v1/research/coverage` | `HttpDataSource` | Matching route |
| `/api/v1/models` | `HttpDataSource` | Matching route |
| `/api/v1/models/{direction}` | `HttpDataSource` | Matching route |
| `/api/v1/evidence` | `HttpDataSource` | Matching route |
| `/api/v1/evidence/{layer}` | `HttpDataSource` | Matching route |
| `/api/v1/backtests/baseline` | `HttpDataSource` | Matching route |
| `/api/v1/stocks` | `HttpDataSource` | Matching route |
| `/api/v1/stocks/{ticker}` | `HttpDataSource` | Matching route |
| `/api/v1/security-metadata` | No dedicated web adapter identified in this audit | Gap — review DTO and UI use |
| `/api/v1/security-metadata/{ticker}` | No dedicated web adapter identified in this audit | Gap — review DTO and UI use |
| `/api/v1/analysis/screener` | `ScreenerDataSource` feature contract | Route present; verify response schema and data availability |
| `/api/v1/stocks/{ticker}/ohlcv` | `OhlcvDataSource` | Matching route; verify response schema and provenance |
| `/api/v1/stocks/{ticker}/analysis` | `StockAnalysisDataSource` | Matching route; verify response schema and publication status |
| `/api/v1/operations/runs` | Existing `OperationsDataSource` calls `/api/v1/operations` | **Path mismatch**; design a dedicated runs adapter |
| `/api/v1/operations/freshness` | `FreshnessDataSource` feature contract | Route present; verify response schema |
| `/api/v1/operations/alerts` | `OperationalAlertsDataSource` feature contract | Route present; verify response schema |

No `GET /api/v1/operations` route was found in the reviewed backend `app.py`. The web Operations overview must not be assumed operational in HTTP mode because a similarly named API family exists.

The frontend's proposed `/api/v1/stocks/{ticker}/evaluations` endpoint is **not** among the reviewed `app.py` GET routes; keep evaluation presentation disconnected unless a verified provider is introduced.

## Contract boundaries

- All backend capabilities beyond these public GET routes (including KRX collection scheduling, persistent market capture, paper trading and risk engine) are **not automatically public APIs**. Do not construct web requests to internal Python components.
- Backend `docs/operations-api.md` documents `operations_v1` for runs, freshness and alerts, with UTC timestamps, nullable unknown fields, and recorded versus advisory evidence. Follow the actual DTOs; do not infer health from HTTP 200 or fabricate successful executions.
- Existing specialized frontend adapters default to `disconnected` unless explicitly configured. Default mock content is not live market data. Preserve error visibility and fail-closed behavior.
- Core research API reads an approved immutable snapshot. Neither successful API health nor a completed CI run proves that snapshot freshness or KRX coverage.
- Keep API host loopback-only until authentication, authorization, TLS, and deployment policy have been reviewed.

## Delivery plan (independent PRs)

1. **P0 — Operations contract alignment:** replace the obsolete `/api/v1/operations` expectation with `/runs`, preserving `operations_v1` payload semantics and pagination. Add DTO/adapter tests and explicit disconnected/empty/error states. Do not mark this done before test evidence.
2. **P0 — Contract verification:** reconcile `FreshnessDataSource`, `OperationalAlertsDataSource`, `ScreenerDataSource`, `OhlcvDataSource` and `StockAnalysisDataSource` with current backend response models; add deterministic fixture contract tests. Route existence alone is insufficient.
3. **P1 — Security metadata:** examine DTOs and coverage quality before adding lookup/search UI; unknown names/sectors remain unknown.
4. **P1 — Evaluation gating:** retain disconnected state until a reviewed backend route or alternative publication contract exists.
5. **P2 — Newer KRX operations and paper-trading experiences:** inventory published APIs, request narrow read-only endpoints from backend owner where missing, then implement web views based on authorized, attributable data.

## Verification checklist

- Compare backend `app.py` route table against all frontend URL builders after every API release.
- Validate request parameters and versioned response DTOs using deterministic fixtures.
- Run `npm run check` (lint, typecheck, unit tests, production build) in frontend CI.
- Separately start a reviewed DonghakStockVision API snapshot and Next.js in HTTP mode; run `npm run verify:http` and feature-specific HTTP smoke tests.
- Confirm unavailable/missing/corrupt evidence produces explicit unknown/error states, never silent mock fallback.
- Record the backend revision and snapshot fingerprint for live E2E evidence.

## No runtime verification performed

This audit only records verified code-level route differences. It does **not** assert a successful runtime integration, CI result, stock data freshness, or operation execution.
