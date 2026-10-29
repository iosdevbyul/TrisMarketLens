# Verification gates: CI vs. approved local backend

## Gate 1 — GitHub Actions (automatic, every PR and main push)

The `.github/workflows/ci.yml` job performs:
- Install locked Node 22 dependencies with `npm ci`
- Production dependency security audit
- ESLint and TypeScript type checking
- Vitest unit tests
- `npm run verify:scripts`: **offline syntax checks only** for both HTTP smoke scripts
- Next.js production build

**Passing CI does not mean the scripts contacted DonghakStockVision.** Syntax checks cannot confirm route existence, response contents, price integrity, backend availability, data freshness or research authorization.

## Gate 2 — Local HTTP integration (manual, not included in CI)

Use a separately started, authorized **read-only** DonghakStockVision instance and reviewed snapshot/publications. Do not run against unapproved or remotely exposed data sources.

1. Start the approved backend locally and confirm `http://127.0.0.1:8000/api/v1/health` returns the expected read-only health contract.
2. Start TrisMarketLens on the same machine with `MARKET_LENS_DATA_SOURCE=http` and `DONGHAK_API_BASE_URL=http://127.0.0.1:8000`.
3. Set `MARKET_LENS_URL=http://127.0.0.1:3000` and a supported `MARKET_LENS_VERIFY_TICKER` in `.env.local`.
4. Run `npm run verify:http` for the research snapshot/frontend health integration checks.
5. Run `npm run verify:extensions` for published Operations, Screener, OHLCV and stock-analysis HTTP checks.
6. Inspect `/diagnostics?ticker=<your-approved-six-character-ticker>` and confirm displayed status matches the actual backend without mock fallbacks.

A route that is intentionally not configured (e.g., optional OHLCV publication or analysis) can cause the extended smoke test to fail. Record the missing prerequisite, rather than treating the failure as proof of corrupt data.

## Gate 3 — Evidence and authorization review (manual)

Check immutable market DB fingerprint, data-provider authorization scope, publication snapshot integrity, source provenance, coverage and market freshness. HTTP 200 responses, nonempty records and a green CI run **never** certify this review.

Prediction evaluation remains excluded until the reviewed API contract is published. No verification command collects market data, executes models, places trades or repairs files.

## Reporting

Record the PR/commit, CI run URL, both local test command outcomes, backend snapshot identity and selected ticker, plus any missing prerequisites. If local checks were not executed, explicitly mark them **not run** rather than passing.
