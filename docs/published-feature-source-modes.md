# HTTP data-source mode for published features

Setting `MARKET_LENS_DATA_SOURCE=http` enables the six reviewed, read-only extension adapters without separate feature flags: Operations runs, Operations freshness, Operations alerts, Screener, OHLCV and per-stock analysis. They share `DONGHAK_API_BASE_URL`. API or response failures remain visible; there is **no implicit mock fallback**.

`MARKET_LENS_DATA_SOURCE=mock` continues to mock the core research UI while specialized extensions default to `disconnected` rather than inventing records. An explicit `MARKET_LENS_<FEATURE>_SOURCE` override still wins, including `disconnected` for a backend not started with optional publication inputs, and `mock` for explicitly fictional demonstrations.

**Exception:** prediction evaluation stays default `disconnected` because the reviewed backend does not expose a published evaluations GET endpoint. Do not enable its HTTP mode until an approved endpoint and contract tests exist.

A valid `/api/v1/health` response does **not** prove optional market DB, DART evidence, analysis publication, freshness or run success. For actual HTTP validation, start an approved loopback backend and run `npm run verify:http` and `npm run verify:extensions` with the required `.env.local` configuration and selected ticker. GitHub CI alone does not execute those local integration checks.
