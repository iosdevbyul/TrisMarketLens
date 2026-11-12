# Daily AI research viewer (read-only)

The existing stock detail page at `/stocks/{ticker}` now has a separate **Daily AI research** section. It reads `GET /api/v1/stocks/{ticker}/research-analysis`, using the existing `DONGHAK_API_BASE_URL`. The original reviewed `/analysis` publication, its validator, chart markers and evaluation UI remain separate and unchanged.

Set `MARKET_LENS_DAILY_RESEARCH_SOURCE=http` explicitly to enable the new series. The default is `disconnected`; it does not silently inherit the approved-publication source mode or display fabricated research on HTTP failure. The backend must be configured with an operator-reviewed immutable research snapshot. A 503 means that snapshot is unavailable. No records means no retained daily research, not a completed model run.

The backend contract is `daily_research_series_v1` in DonghakStockVision PR #229 (`docs/daily-research-results-api.md`). Exact date or inclusive from/to date, page limit (1–200) and offset (0–100000) are accepted; exact and range filters cannot be combined. The viewer shows latest page, status, model, provenance, source references, input fingerprint, windows and last successful result origin, with previous/next pagination.

Research scores are **uncalibrated conditional research scores**, not price-increase probabilities or independently validated future predictions. `synthetic_fixture` is explicitly shown as synthetic. Incomplete runs cannot carry invented scores or signals. All PIT, performance, forward eligibility, custody, chronology and execution authorization flags remain false, and performance metrics remain null.

Run `npm run check` for lint, typecheck, Vitest and build. Fixture-backed contract tests do not establish that operator-managed live daily analysis data exists. Live HTTP E2E remains BLOCKED until the backend PR is merged, the reviewed serving snapshot is configured and retained real daily jobs are present.
