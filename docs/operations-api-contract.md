# Operations read-only adapter

The operations panel is independent of the existing research DataSource. It never starts market collection, trains models, or schedules background work.

Set `MARKET_LENS_OPERATIONS_SOURCE` in `.env.local`:

- `disconnected` (default): no fake analysis history.
- `mock`: **clearly labeled** static example records to test the interface.
- `http`: requests `GET /api/v1/operations` from `DONGHAK_API_BASE_URL`.

Operations HTTP failures and invalid snapshots produce an explicit degraded state without silently falling back to mock data. Fetches are uncached and timeout after 5 seconds.

Expected payload:

```json
{
  "connection": "connected",
  "checkedAt": "2026-10-01T18:30:00+09:00",
  "latestDataThrough": "2026-10-01",
  "nextScheduledRun": null,
  "runs": [
    {
      "id": "unique-run-id",
      "pipeline": "daily-analysis",
      "state": "succeeded",
      "startedAt": "2026-10-01T18:30:00+09:00",
      "finishedAt": "2026-10-01T18:40:00+09:00",
      "dataThrough": "2026-10-01",
      "summary": null
    }
  ]
}
```

Run states: `queued`, `running`, `succeeded`, `failed`, `blocked`. Missing date/time fields use `null`, never inferred dates. The backend endpoint is **not implemented by this change**. Actual collection and scheduling will remain the responsibility of DonghakStockVision.
