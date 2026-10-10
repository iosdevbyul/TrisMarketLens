# OHLCV read-only chart integration

This feature replaces the chart placeholder with a server-rendered SVG daily candlestick and volume chart, preserving TrisMarketLens dark theme tokens.

Configuration: `MARKET_LENS_OHLCV_SOURCE=disconnected|mock|http` (default disconnected).
- disconnected: no candles shown.
- mock: clearly labeled artificial price/volume series, **never real market data**.
- http: read-only `GET /api/v1/stocks/{ticker}/ohlcv` via `DONGHAK_API_BASE_URL`. Backend endpoint is not implemented by this PR.

Example payload:
```json
{ "ticker": "005930", "bars": [
  { "date": "2026-10-01", "open": 100, "high": 105, "low": 98, "close": 103, "volume": 12000 }
]}
```
Illustrative values only. Bars must be chronological and unique; prices must be positive, high/low must bound open/close, and volumes must be nonnegative integers. An HTTP failure or malformed payload shows a visible error with no invented chart. The visualization shows up to the latest 100 provided bars, including date labels and volume. No trading signals or investment inference are generated.
