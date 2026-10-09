# Tris Market Lens HTTP API contract

This document defines the frontend contract planned for DonghakStockVision.
The backend endpoints are not implemented by this repository.

## Data source modes

Tris Market Lens supports two server-side data source modes.

- `mock` is the default and requires no backend.
- `http` delegates every research read to DonghakStockVision.

Configure the mode with:

```text
MARKET_LENS_DATA_SOURCE=mock
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
```

When `MARKET_LENS_DATA_SOURCE=http`, `DONGHAK_API_BASE_URL` is required.

## Endpoints

| Frontend method | HTTP request |
| --- | --- |
| `getProjectStatus()` | `GET /api/v1/project/status` |
| `getCoverageSummary()` | `GET /api/v1/research/coverage` |
| `getModelSummaries()` | `GET /api/v1/models` |
| `getModel(direction)` | `GET /api/v1/models/{direction}` |
| `getEvidenceLayers()` | `GET /api/v1/evidence` |
| `getEvidenceLayer(id)` | `GET /api/v1/evidence/{id}` |
| `getBaselineBacktest()` | `GET /api/v1/backtests/baseline` |
| `getStocks()` | `GET /api/v1/stocks` |
| `getStock(ticker)` | `GET /api/v1/stocks/{ticker}` |

All successful responses are JSON and must match the existing TypeScript domain
contracts in `src/domain`.

Detail endpoints map HTTP 404 to `null`, allowing the Next.js route to render its
normal not-found state. Other non-2xx responses fail closed with
`HttpDataSourceError`.

## Caching

HTTP requests currently use `cache: "no-store"`. Research readiness, evidence,
and future run results should not be silently served from stale Next.js fetch
cache while the backend integration is being established.

## Ownership

TrisMarketLens owns:

- presentation
- navigation
- frontend domain contracts
- HTTP adaptation and error propagation

DonghakStockVision will own:

- market data
- evidence and quality policy
- model artifacts and research metrics
- signals
- backtest inputs and immutable results

The frontend must not recreate or reinterpret research logic.
