# Tris Market Lens

Research-driven market intelligence UI for DonghakStockVision.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest

The web repository owns presentation and frontend data contracts. The existing
DonghakStockVision Python project remains responsible for market data, research
logic, evidence, model inference, and backtesting.

## Current architecture

TrisMarketLens -> DataSource -> MockDataSource (default)
TrisMarketLens -> DataSource -> HttpDataSource -> DonghakStockVision API (prepared)

The frontend now selects its server-side data source through environment
configuration. Mock mode remains the default so the UI can run without the Python
API.

## Run locally

Opening http://localhost:3000 does not start the app by itself. A local Next.js
development server must be running on the same computer first.

Requires Node.js 22.

For a fresh local checkout:

```bash
git clone https://github.com/iosdevbyul/TrisMarketLens.git
cd TrisMarketLens
cp .env.example .env.local
npm install
npm run dev
```

For an existing checkout:

```bash
git switch main
git pull
cp .env.example .env.local
npm install
npm run dev
```

Then open:

- http://localhost:3000
- http://localhost:3000/api/health

The health endpoint returns the running app name and selected data-source mode.

## Data source configuration

Default local mode:

```text
MARKET_LENS_DATA_SOURCE=mock
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
```

The API URL is ignored while the mode is `mock`.

When DonghakStockVision exposes the planned FastAPI contract, switch to:

```text
MARKET_LENS_DATA_SOURCE=http
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
```

HTTP mode fails closed if the API URL is missing or requests fail.

See `docs/http-api-contract.md` for the endpoint contract.

## Current routes

- / research overview
- /stocks searchable stock explorer
- /stocks/[ticker] stock detail and OHLC/evidence integration surface
- /models qualified model overview
- /models/[direction] model qualification, validation/OOS metrics, configuration, and artifact provenance
- /evidence evidence-layer overview and baseline-freeze blockers
- /evidence/[layer] calendar, settlement, DART, security-lifecycle, and corporate-action evidence details
- /backtesting backtest overview and run-readiness gate
- /backtesting/baseline locked baseline contract, chronology, policy, and performance placeholders
- /api/health local app health check

The UI does not execute models, signals, evidence collection, or backtests and
does not present simulated performance as real research output.

Evidence pages preserve scope boundaries. A verified market-wide calendar or
settlement layer does not imply that per-security lifecycle or corporate-action
coverage is complete. Open research blockers stay visible and fail closed.

The baseline backtest page exposes the already-locked policy and chronology only.
The signal anchor ends on 2025-06-30. Execution-only sessions may resolve pending
entries and open positions afterward without generating new signals, followed by
the settlement tail. Performance fields remain empty until the immutable run is
actually executed.

## Validation

```bash
npm run check
```

This runs linting, TypeScript checks, unit tests, and a production build.

## Branch workflow

Development is performed on task branches and merged through pull requests after
CI passes. Do not develop directly on `main`.
