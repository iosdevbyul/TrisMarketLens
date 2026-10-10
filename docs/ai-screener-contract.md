# AI Screener frontend contract

Set `MARKET_LENS_SCREENER_SOURCE=disconnected|mock|http` (default disconnected). Mock contains explicitly fictional examples. HTTP requests **one aggregated endpoint** `GET /api/v1/analysis/screener` from `DONGHAK_API_BASE_URL`, rather than calling 993 stock APIs per page.

Payload: `{ "entries": [{ "ticker": "005930", "name": null, "analysisId": "...", "modelId": "...", "modelVersion": "...", "direction": "up", "score": 0.72, "validation": "pending", "dataThrough": "2026-10-01", "analyzedAt": "2026-10-01T18:30:00+09:00" }] }`.

This aggregate endpoint is **not yet implemented** by DonghakStockVision. The frontend does not compute predictions, and failures return empty results rather than fake analyses. Multiple analyses per ticker are supported with unique ticker+analysisId. Filters operate on the returned collection. Future backend pagination may be required as the corpus grows.
