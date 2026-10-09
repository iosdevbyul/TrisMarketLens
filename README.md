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

TrisMarketLens -> DataSource -> MockDataSource (current)
TrisMarketLens -> DataSource -> HttpDataSource -> DonghakStockVision API (planned)

Current routes:

- / research overview
- /stocks searchable mock stock explorer
- /stocks/[ticker] stock detail and OHLC/evidence integration surface
- /models qualified model overview
- /models/[direction] model qualification, validation/OOS metrics, configuration, and artifact provenance
- /evidence evidence-layer overview and baseline-freeze blockers
- /evidence/[layer] calendar, settlement, DART, security-lifecycle, and corporate-action evidence details
- /backtesting backtest overview and run-readiness gate
- /backtesting/baseline locked baseline contract, chronology, policy, and performance placeholders

The UI intentionally uses typed mock research snapshots until the HTTP API is
available. It does not execute models, signals, evidence collection, or backtests
and does not present simulated performance as real research output.

Evidence pages preserve scope boundaries. A verified market-wide calendar or
settlement layer does not imply that per-security lifecycle or corporate-action
coverage is complete. Open research blockers stay visible and fail closed.

The baseline backtest page exposes the already-locked policy and chronology only.
The signal anchor ends on 2025-06-30. Execution-only sessions may resolve pending
entries and open positions afterward without generating new signals, followed by
the settlement tail. Performance fields remain empty until the immutable run is
actually executed.

## Development

Requires Node.js 22.

Run npm install, then npm run dev, and open http://localhost:3000.

## Validation

Run npm run check.

This runs linting, TypeScript checks, unit tests, and a production build.

## Branch workflow

Development is performed on task branches and merged through pull requests after
CI passes. Do not develop directly on main.
