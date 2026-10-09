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

```text
TrisMarketLens
  Next.js UI
      |
      v
  DataSource
      |
      +-- MockDataSource  (current)
      |
      +-- HttpDataSource  (planned)
              |
              v
        DonghakStockVision API
```

The initial dashboard intentionally uses mock research status data. It does not
execute models, signals, or backtests and does not present simulated performance
as real research output.

## Development

Requires Node.js 22.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run check
```

This runs linting, TypeScript checks, unit tests, and a production build.

## Branch workflow

Development is performed on task branches and merged through pull requests after
CI passes. Do not develop directly on `main`.
