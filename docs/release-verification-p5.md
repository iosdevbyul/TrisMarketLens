# TrisMarketLens Web — P5 final release regression and evidence

## Scope

Final web-only release check for P1–P4 changes, as reviewed in the
`iosdevbyul/TrisMarketLens` repository. DonghakStockVision remains read-only.

**Release decision: conditional local-only evaluation. Public/LAN deployment is
NO-GO.** This is not a claim that live source data, real browser interactions,
investment returns, brokerage integration, or source provenance were independently
certified. See `docs/deployment-readiness-p4.md`.

## Automated regression matrix

| User journey or boundary | CI coverage | Physical browser / real backend |
| --- | --- | --- |
| Landing/dashboard and route build | Next.js production build | Not run |
| Stock identity, OHLC date/range, chart markers | Existing validators, P2 month/UTC/provenance tests | Real KRX price-by-price not run |
| AI screener selection, direction/validation filters, sort | Domain tests and P5 real-instant sorting / calendar rules | Browser interaction not run |
| Global model validation/OOS and research layers | HTTP contract and research model tests | Actual model artifact verification not run |
| Research workbench / per-ticker cross-publication | P5 HTTP-only cross-source ID checks; demo/unavailable isolation | Live backend record matching not run |
| Research path and unresolved blockers | Seven-stage independent state tests | Actual publication readiness not run |
| Collection, KRX operations, freshness and alert evidence | Existing operational contract and GET-only smoke fixture tests | Operator-local service not run |
| Historical portfolios (list, selection, detail, compare) | URL/id/contract/CSV regressions; POST comparison unit tests | Real read-only semantic POST not run |
| CSV export and formula-safe representation | Domain CSV tests and P5 bounded source-value smoke assertion | Desktop spreadsheet/manual download not run |
| Missing/503/error/empty/mixed source | Adapters, cross-source check and P5 regression tests | Live HTTP failure injection not run |
| Mobile navigation, keyboard, EN/KO | P3 SSR/accessibility tests and Next build | Physical screen-reader/mobile not run |
| Backend URL policy, no-store, invalid source, secrets | P4 negative tests and health tests | OS network isolation/penetration not run |

The `npm run test` suite includes `src/domain/releaseResearchRegression.test.ts`,
which checks cross-feature invariants in one run. GitHub Actions also executes
ESLint, TypeScript, offline verifier syntax checks, production dependency audit,
and production build. Those checks establish **code regression confidence**, not
permission to expose the local unauthenticated API or serve real financial
data to other users.

## Defects addressed

1. Screener's `Latest analysis` sorting previously used lexical timestamp order.
   Different UTC offsets could display the older publication first. It now
   compares the actual UTC instants and retains stable ticker tie-breaks.
2. Screener API contract could accept an invalid six-character ticker identifier
   or an impossible calendar date. It now rejects those values, consistent with
   OHLCV and stock-analysis date validation.
3. Research workbench previously counted a matching record ID between `mock`
   screener data and an `http` ticker analysis as corroborating evidence.
   Now evidence correspondence is confirmed **only** when both independently
   returned publications are error-free HTTP sources with matching metadata.
   Mixed, disconnected, or failed source data cannot produce a `Found` claim.
   Mock-to-mock remains clearly identified as fictional demo only.

## Manual operator release gate — NOT EXECUTED

With an approved operator-owned backend and web process running locally:

1. Verify listeners are loopback-only (P4 security checklist). Check
   `/api/v1/health` and `/api/health` but never treat their status as proof
   of research or trading readiness.
2. Configure `MARKET_LENS_DATA_SOURCE=http` and
   `DONGHAK_API_BASE_URL=http://127.0.0.1:8000`. Explicit per-feature sources
   must correspond to real backend publications. Do not silently turn on mock.
3. Execute `npm run verify:integration:audit`, `npm run verify:http`, and
   available `npm run verify:extensions` checks; record every `not_tested`,
   `empty`, `unconfigured`, and failure separately.
4. Open overview, stocks, OHLC chart, screener, models, evidence, research
   workbench/path, operations/trace, historical portfolio archive/compare.
   Compare at least one real ticker's dates and exact source-record IDs,
   and confirm a missing analysis is marked unavailable (not predicted).
5. Verify independent publication provenance by configuring screener HTTP and
   stock-analysis mock in a private test configuration: correlation must be
   unavailable and fake records must never be treated as HTTP source evidence.
6. Select reports across archive pages, compare 2–5 reports using the
   read-only semantic POST and check CSV export in an actual spreadsheet.
7. Test 320/375/768/1280px layouts, keyboard Tab navigation, 200% zoom,
   English/Korean labels, browser retry and real failure/503 states.
8. Retain exact run logs, backend snapshot fingerprint, source service versions,
   browser test results and approved credentials/access scope. Log defects
   in a new PR and repeat CI before declaring the web ready.

## Go / No-go

- **CI readiness:** Conditional GO when this PR and the merged `main` CI pass.
- **Single-operator local exploration:** Conditional GO with real backend and
  listener/source evidence reviewed on the operator's machine.
- **Actual live-data correctness / user-facing browser E2E:** NOT VERIFIED.
- **LAN/cloud/public deployment:** NO-GO without an separately approved
  identity-aware gateway, HTTPS, authorization and security assessment.
- **Trading, financial advice, PIT/OOS performance approval:** NOT SUPPORTED.

P5 completion means the **planned web stabilization PR and offline suite**
were delivered; it must not be represented as operator-side live release
certification.
