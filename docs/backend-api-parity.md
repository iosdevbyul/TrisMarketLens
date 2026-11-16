# Backend API parity is the TrisMarketLens completion criterion

TrisMarketLens is not feature-complete until **every available DonghakStockVision
public HTTP API capability is usable from the web**, including legitimate
authenticated mutations that require explicit operator approval.

## Source of truth and inventory

The baseline route inventory was verified on 2026-11-17 directly against
the DonghakStockVision implementation files:

- `src/donghak_stock_vision/api/app.py`
- `src/donghak_stock_vision/api/historical_portfolio_routes.py`
- `src/donghak_stock_vision/ai_model_routes.py`

The 35 method+path declarations appear in `src/domain/backendApiSurface.ts`
and the human-facing `/backend-api-coverage` route. Each entry links the
existing web feature surface. These are **route-to-UI mappings**, not independent
proof of correct coverage or real Mac E2E testing. Any backend addition, deletion
or contract change must be audited and reflected in this inventory.

Completion additionally requires for **each** endpoint:
1. A usable web flow for its purpose; explicit user approval for state changes.
2. Correct authentication, authorization, request/query constraints, response
   validation, error handling and privacy boundaries.
3. Real approved loopback HTTP testing of the running backend, with a clear
   distinction among configured, 404 empty, 503 unpublished, 401/403 unauthorized.
4. Unit, integration and browser regression tests; successful CI.
5. No fabricated study results, price predictions, financial performance claims,
   PIT proofs or automatic trading.

A private opt-in source not configured on the local backend is *not* equivalent
to a web integration bug. Evidence of actual readiness must be verified on
the operator Mac; GitHub CI uses synthetic test data and cannot claim the
private backing snapshots are available.

## Entire security metadata catalog

This PR integrates the backend's **GET /api/v1/security-metadata** envelope,
not just the per-ticker detail endpoint. `/security-metadata` provides
server-side ticker/name filtering, unmapped-only filtering and pagination.
The adapter requires an explicit loopback HTTP origin, disallows redirects,
uses a bounded response, validates exact ticker ordering, corporation joins,
explicit `pitVerified:false` and `operationalQualificationChanged:false`
and returns an allowlisted public presentation. It does not reproduce raw
source evidence fingerprints, URLs, or old historical claims in the browser.

If the backend was not started with verified security metadata enabled, its
503 result is displayed as **unavailable**; users are never shown mock catalog
records in HTTP mode. The catalog's current security name availability is
distinct from exact DART corporation identity; an available current mapping
is not a verified historical identity.

### To review on the operator Mac

After merging, pull main, use the previously configured HTTP backend and
TrisServerManager Next.js process, then open:

- `http://127.0.0.1:3000/security-metadata`
- `http://127.0.0.1:3000/backend-api-coverage`

No backend schema, private DB, experiments, snapshots or AI model are modified.
The metadata endpoint may legitimately be unavailable even while
`/api/v1/health` succeeds.

## Next development batches

Use the inventory as a checklist to audit **functional depth**, not merely
route presence. Prioritize per-route live response cases, authentication
controls, portfolio drilldowns, operator-visible HTTP diagnostics, and
observed research publication limitations. Each batch should be a coherent
feature PR with relevant tests and GitHub CI, rather than repetitive
micro-PRs. Do not declare the site done from the number of mapped links alone.
