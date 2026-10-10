# Stock analysis read-only contract

The stock detail page accepts analysis records independently of existing DonghakStockVision research endpoints. **It does not run models or calculate scores.**

Set `MARKET_LENS_STOCK_ANALYSIS_SOURCE` to `disconnected` (default), `mock` (explicitly marked fictional examples), or `http` (read-only).

HTTP requests `GET /api/v1/stocks/{ticker}/analysis` from `DONGHAK_API_BASE_URL`. This backend endpoint is **future work**. An unavailable or malformed response leaves predictions empty with a visible error, never a fake successful model run. Dates require ISO formats, timestamps require timezone offsets, scores are finite numbers between 0 and 1 or null, and returned tickers must match the request.

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
