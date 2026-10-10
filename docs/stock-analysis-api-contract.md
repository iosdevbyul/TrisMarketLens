# Stock analysis read-only contract

The stock detail page accepts analysis records independently of existing DonghakStockVision research endpoints. **It does not run models or calculate scores.**

Set `MARKET_LENS_STOCK_ANALYSIS_SOURCE` to `disconnected` (default), `mock` (explicitly marked fictional examples), or `http` (read-only).

HTTP requests `GET /api/v1/stocks/{ticker}/analysis` from `DONGHAK_API_BASE_URL`. This endpoint is supplied by DonghakStockVision PR #46 as an **opt-in read-only transport**. It returns HTTP 503 when no separately reviewed per-security publication is configured, and an empty record list when the publication contains no records for that ticker. The pre-existing aggregate model-performance publication is not a source of per-ticker predictions. An unavailable or malformed response leaves predictions empty with a visible error, never a fake successful model run. Dates require ISO formats, timestamps require timezone offsets, scores are finite numbers between 0 and 1 or null, and returned tickers must match the request.

Example contract (format illustration, not a real analysis):

```json
{
  "ticker": "005930",
  "records": [
    {
      "id": "unique-analysis-id",
      "ticker": "005930",
      "analyzedAt": "2026-10-01T18:30:00+09:00",
      "dataThrough": "2026-10-01",
      "modelId": "registered-model-id",
      "modelVersion": "immutable-model-version",
      "direction": "up",
      "score": 0.72,
      "validation": "pending",
      "explanation": null
    }
  ]
}
```

Direction values: `up`, `down`, `neutral`. Validation: `verified`, `pending`, `blocked`. A model's score alone is not a probability calibration guarantee or investment recommendation.

Do not switch `MARKET_LENS_STOCK_ANALYSIS_SOURCE=http` expecting real predictions until a reviewed per-ticker publication exists and is configured in DonghakStockVision. HTTP 200 with `records: []` is a valid empty result, **not** an AI execution success indicator.
