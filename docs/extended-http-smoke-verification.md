# Extended backend HTTP smoke verification

This check is a **manual, local, read-only integration test**. It does not run in frontend CI because CI has neither an authorized DonghakStockVision backend instance nor a validated immutable market database and publication snapshot. Passing CI alone is not a claim of successful real-data integration.

## Prerequisites

Start the approved backend locally on `127.0.0.1:8000`. Configure a reviewed snapshot, and, for OHLCV and stock analysis, the explicitly authorized immutable market DB and approved analysis publication. Route availability and nonempty results depend on those startup inputs.

In `.env.local`:

```dotenv
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
MARKET_LENS_VERIFY_TICKER=005930
```

Choose a real ticker supported by the configured backend. Run:

```bash
npm ci
npm run verify:extensions
```

The script requires a loopback backend and checks the actual read-only routes for Operations runs/freshness/alerts, Screener, OHLCV and stock analysis. It checks the expected envelope shapes, pagination and verified-only numeric score requirements. It does **not** invent price observations or infer healthy market freshness from an HTTP 200.

A successful run confirms only a limited HTTP smoke test with the backend instance used. It does not replace source provenance, snapshot integrity, end-to-end frontend rendering checks, completeness or risk approval. A 404/503 fails the check rather than substituting mock data.
