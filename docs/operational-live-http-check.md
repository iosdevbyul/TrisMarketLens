# Verify collected KRX data against a running local backend

Use this only after an operator has configured an approved, immutable operational SQLite snapshot on the running DonghakStockVision HTTP server. The command **reads** the running backend; it does not connect to the database or contact KRX directly.

Set local `.env.local` values:

```dotenv
MARKET_LENS_DATA_SOURCE=http
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
MARKET_LENS_VERIFY_TICKER=005930
```

Run:

```bash
npm run verify:operational
```

The script reads `/api/v1/health`, paginates the **entire** `/api/v1/operational/stocks` catalog, confirms stable totals, unique sorted ticker codes, dates and `unreviewed` status, then reads original OHLCV bars for the chosen ticker (or first observed ticker if unset). It fails on an empty catalog, missing ticker, unavailable endpoint, unexpected data, or invalid price history. It prints **the returned ticker total**, not a hardcoded 940. It never writes data or makes market-provider requests.

For the web, run `npm run dev`, then inspect `/operational-market`, a returned ticker's OHLCV detail page and `/operations`. Verify the observed ticker count and last date against the local backend response.

**Limitations:** Passing this read-only HTTP check proves the configured server returned internally consistent response shapes for its current snapshot. It does not independently verify provenance, KRX authorization, the historical claim of 940 collected tickers, completeness, research approval or trading eligibility. GitHub CI only checks the JavaScript syntax; it cannot contact the user's loopback backend.
