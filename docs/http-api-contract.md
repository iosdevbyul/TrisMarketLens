# Tris Market Lens HTTP API contract

This document defines the frontend contract implemented by the read-only
DonghakStockVision FastAPI transport.

## Data source modes

Tris Market Lens supports two server-side data source modes.

- `mock` is the default and requires no backend.
- `http` delegates every research read to DonghakStockVision.

Configure the mode with:

```text
MARKET_LENS_DATA_SOURCE=http
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
MARKET_LENS_URL=http://127.0.0.1:3000
```

When `MARKET_LENS_DATA_SOURCE=http`, `DONGHAK_API_BASE_URL` is required.

## Endpoints

| Frontend method | HTTP request |
| --- | --- |
| health diagnostic | `GET /api/v1/health` |
| `getProjectStatus()` | `GET /api/v1/project/status` |
| `getCoverageSummary()` | `GET /api/v1/research/coverage` |
| `getModelSummaries()` | `GET /api/v1/models` |
| `getModel(direction)` | `GET /api/v1/models/{direction}` |
| `getEvidenceLayers()` | `GET /api/v1/evidence` |
| `getEvidenceLayer(id)` | `GET /api/v1/evidence/{id}` |
| `getBaselineBacktest()` | `GET /api/v1/backtests/baseline` |
| `getStocks()` | `GET /api/v1/stocks` |
| `getStock(ticker)` | `GET /api/v1/stocks/{ticker}` |

All successful research responses are JSON and must match the existing TypeScript
domain contracts in `src/domain`.

Stock `name` and `sector` are nullable. The backend only publishes a company
name when an exact current DART stock-code mapping is verified, and the current
snapshot exporter has no approved sector source. The UI must therefore use neutral
fallback labels rather than inventing metadata.

Detail endpoints map HTTP 404 to `null`, allowing the Next.js route to render its
normal not-found state. Other non-2xx responses fail closed with
`HttpDataSourceError`.

## Frontend health

`GET /api/health` reports the selected Tris Market Lens data-source mode.

In mock mode, backend health is `not_required`.

In HTTP mode, the route calls DonghakStockVision `/api/v1/health`. It returns 200
only when the backend reports the expected `read_only` health payload. A missing
API URL, network failure, non-2xx response, or unexpected payload returns 503 with
frontend status `degraded`.

## Real-data E2E verification

With the DonghakStockVision API and Tris Market Lens development server both
running in HTTP mode:

```bash
npm run verify:http
```

The verifier checks backend health, project status, coverage, models, evidence,
baseline state, stock count versus universe, one stock-detail route, and the
frontend health endpoint. It does not execute models, signals, evidence
collection, or backtests.

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
- connection diagnostics

DonghakStockVision owns:

- market data
- evidence and quality policy
- model artifacts and research metrics
- signals
- backtest inputs and immutable results
- the read-only research API snapshot

The frontend must not recreate or reinterpret research logic.
