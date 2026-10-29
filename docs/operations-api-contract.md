# Operations HTTP read-only contract

The Operations UI uses the published DonghakStockVision `operations_v1` read-only transport, not the obsolete `GET /api/v1/operations` endpoint.

## Configuration

Set `MARKET_LENS_DATA_SOURCE=http` and `DONGHAK_API_BASE_URL=http://127.0.0.1:8000` to enable the published Operations, Freshness and Alerts adapters. Optional per-feature overrides (`MARKET_LENS_OPERATIONS_SOURCE`, `MARKET_LENS_FRESHNESS_SOURCE`, `MARKET_LENS_ALERTS_SOURCE`) can select `disconnected`, `mock` or `http`. Without HTTP mode, specialized features stay disconnected by default. Mock results are fictional and explicitly labeled.

The HTTP adapter performs uncached GET requests with a 5-second timeout. Failed requests or invalid responses are shown as errors without falling back to mock.

## Published endpoints

| Feature | Endpoint | Payload |
| --- | --- | --- |
| Operations history | `GET /api/v1/operations/runs?offset=0&limit=25` | `RunsPayload` |
| Source freshness | `GET /api/v1/operations/freshness` | `FreshnessPayload` |
| Operational alerts | `GET /api/v1/operations/alerts?offset=0&limit=25` | `AlertsPayload` |

All three responses use `schemaVersion: "operations_v1"`. The history and alert endpoints return `items`, `total`, `offset` and `limit`. Freshness returns `items`. Pagination and per-record fields must be validated before display.

### Operations runs response example (illustrative structure only)

```json
{
  "schemaVersion": "operations_v1",
  "items": [
    {
      "id": "collection-123",
      "operationType": "market_ingestion",
      "startedAt": null,
      "completedAt": "2026-10-29T13:00:00Z",
      "executionStatus": "completed",
      "evidenceStatus": "partial",
      "recordCount": 20,
      "sourceType": "sqlite_collection_audit",
      "semanticApproval": false,
      "blockingStatus": null,
      "diagnostic": "recorded_outcome_not_provenance"
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 25,
  "evidenceStatus": "partial",
  "diagnostic": null
}
```

`operationType` may be `dart_batch_acquisition`, `dart_session` or `market_ingestion`. `executionStatus` can be `completed`, `incomplete`, `failed`, `interrupted` or `not_started`. `evidenceStatus` can be `validated`, `partial`, `invalid` or `unavailable`.

The frontend maps these read-only records to its Operations presentation model. In particular, an execution recorded as `completed` **does not prove successful market ingestion, source provenance or semantic approval**; the UI deliberately retains `unknown` when that is all the backend can establish. Absent market dates, scheduler timestamps and validation results remain `null`, never inferred from run history.

## Boundary with live KRX market data

`/api/v1/operations/runs` exposes recorded collection outcomes, not the stock universe or price bars. Operational SQLite data does **not** automatically become research API data.

The backend has an opt-in `OhlcvMarketReader` for a separately pinned immutable SQLite file, verified by SHA-256 and queried in SQLite read-only immutable mode. Its stock-price route `GET /api/v1/stocks/{ticker}/ohlcv` is only usable when that approved reader is configured in the running backend. The running server and specific collected 940-ticker dataset have **not** been verified as exposed through this route.

Before displaying those 940 collected securities as actual live data, the backend must explicitly establish a safe **operational-store read contract** (or a reviewed immutable export), including the source database identity, approved scope, consistency boundary, metadata, pagination/universe listing, ticker lookup, absence/error semantics and read-only guarantees. Do not route mutable production collection files directly into research snapshots or infer universe membership from historic research coverage.

## Live validation

1. Start an operator-authorized read-only backend with approved publication inputs.
2. Confirm backend health, then execute `npm run verify:http` and `npm run verify:extensions` with the approved ticker and explicit HTTP mode.
3. Inspect `/operations` and `/diagnostics?ticker=005930` using an actually supported ticker. Confirm data source and errors are displayed honestly, with no demo fallback.
4. Separately verify operational-store provenance and coverage before claiming the collected 940 tickers are accessible.

Successful CI checks are not substitutes for the live backend steps. The web does not initiate market collection, inference, trading, or scheduler changes.
