# Exchange-calendar freshness contract

The frontend does **not** determine the KRX exchange calendar, holiday schedule, settlement dates, or when a trading session is complete. That authority belongs to the DonghakStockVision backend.

Use `MARKET_LENS_FRESHNESS_SOURCE=disconnected|mock|http` (default `disconnected`). The mock report is explicitly fictional. HTTP queries `GET /api/v1/operations/freshness`, a future backend endpoint.

Expected payload (example only):
```json
{
  "calendarId": "verified-calendar-version",
  "expectedSession": "2026-10-01",
  "validatedThrough": "2026-09-30",
  "assessedAt": "2026-10-01T19:00:00+09:00",
  "state": "delayed",
  "reason": "Upstream validation incomplete"
}
```

The backend must select the latest *completed expected trading session* and compare it with validated coverage under its own policy. The frontend checks only report consistency. Missing reports are unknown; errors never fall back to mock data. The original Operations status API is unchanged.
