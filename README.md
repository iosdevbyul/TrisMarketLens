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
- /evidence evidence readiness and open blockers
- /backtesting locked baseline run gate

The UI intentionally uses typed mock research snapshots until the HTTP API is
available. It does not execute models, signals, or backtests and does not present
simulated performance as real research output.

The model detail pages expose already-qualified research metrics and locked
artifact metadata only. They do not load model files or invoke inference.

## Development

Requires Node.js 22.

Run npm install, then npm run dev, and open http://localhost:3000.

## Validation

Run npm run check.

This runs linting, TypeScript checks, unit tests, and a production build.

## Branch workflow

Development is performed on task branches and merged through pull requests after
CI passes. Do not develop directly on main.
