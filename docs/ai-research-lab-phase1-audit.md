# AI Research Lab — Phase 1 source audit and PR A contract

## Baseline reviewed (2026-11-17)

Sources directly inspected:
- DonghakStockVision current main API entrypoint `src/donghak_stock_vision/api/app.py`, `src/donghak_stock_vision/ai_model_routes.py`
- DonghakStockVision merged PR #245 changed files, especially `src/donghak_stock_vision/storage/autonomous_research.py`, `src/donghak_stock_vision/storage/gemma_memory.py`, `docs/historical-research-expansion.md`
- TrisMarketLens current main `src/app/autonomous-research/page.tsx`, `src/data/AutonomousResearchDataSource.ts`, `src/domain/autonomousResearchPublication.ts`, `src/components/research/AutonomousStudyInsights.tsx`, `src/app/research-status/page.tsx`, `src/domain/backendApiSurface.ts`
- Previous web PR #185 (within-study evaluation distributions), #186 (public backend route inventory), both merged at baseline
- Backend PR #245: merged. Backend PR #246: GitHub API returned 404 at audit time; its future behavior and outputs are **not assumed**

Only confirmed artifacts and contracts below inform UI availability. A requirement mentioned in the project brief is **not** evidence that the entire value is already safely published.

## Capability classification

| Requested capability | Classification | Existing source and boundary |
| --- | --- | --- |
| Reviewed per-ticker Daily Research status | Already implemented | `research-status`, `DailyResearchDataSource`; backend snapshot may be 503 |
| Autonomous study-level retained run, selection, result, terminal counts | Already implemented | `autonomous_research_local_publication_v1`, manually exported, bounded, redacted |
| Within-study Mean AP, Stability AP, worst BA distribution | Already implemented | PR #185; no cross-dataset ranking |
| Research LLM model catalog, selected LLM and comparison contracts | Already implemented | Authenticated `/api/v1/ai/models` endpoints; no stock model promotion |
| Unified AI Research Lab summary and study search with honest statuses | Extend existing | PR A adds `/ai-research-lab`, derived from the existing local publication |
| Individual retained result drilldown | Extend existing | PR A adds observation-level pages with scores and approval flags, **without fabricated Experiment IDs** |
| Full filtered list by true cohort, 1/5/20 horizon, policy and dataset version | Backend API support needed | Current web publication deliberately redacts config, dataset and experiment IDs |
| Best search candidate vs selected vs independently validated | Backend API support needed | No safe candidate/selection/final independent proof joins published |
| Actual run→selection→result→terminal and hypothesis lineage | Backend API support needed | Record positions are not stable event identity or causal keys |
| Exact independent calendar/heldout/market-regime diagnostics, Brier, AP baseline delta | Backend API support needed | Existing redacted publication only exports presence flags and three retrospective metrics |
| Full six final research report viewer | Backend API support needed | No general audited report list/content endpoint found in existing app router; do not read private Markdown directly |
| Actual current CPU/memory/progress, costs, active execution | Backend API support needed | Prior `autonomous_run` snapshots are not live process telemetry |
| Approved sanitized report download | New UI after backend publication | Requires explicit sanitized report contract with bounded content and release policy |
| Study-specific safe evidence/absence matrices | Extend existing | Show observed flags as recorded, never infer whole-study or investment approval |

## Why the current publication cannot prove 72 experiments or six final reports

The local operator export produced 16 eligible databases, 14 skipped databases,
31 retained run records, 169 retained result records and 169 terminal records.
Those are independent artifact counts across potentially overlapping study
databases, *not* a deduplicated tally of 72 experiments nor a list of six
complete final reports. Counts are reproducible from the publication only.
Neither the provided historical number nor raw private report files are
reformatted as web-verified evidence.

## What PR A adds

- Landing view with counts, partial coverage, last recorded run timestamp,
  and explicit unavailable/unknown status for live execution and final reports.
- Bounded search over actual study folder labels and recorded research agents.
- Filters over *observed* run/terminal status; `running` is explicitly a
  historical record, not a live-state assertion.
- Per-study page preserving existing evaluation distribution viewer links.
- Observation detail route for each bounded actual `autonomous_result`, with
  Mean AP, Stability AP, worst balanced accuracy and explicit PIT/performance/
  execution flags, but no invented experiment reference or private PIN.
- Navigation from existing integrated research views and research lab.

## Required reviewed backend read-only contract for PR B/C/D

Do **not** modify DonghakStockVision from the web repository. Once separately
approved, request a strictly local, authenticated (where required) and bounded
public projection or export containing:

1. `studyRef` / `experimentRef` **opaque public references** with stable
   source-backed joins, explicitly not raw hashes, source PINs or disk paths.
2. Declared `cohort`, tickers, horizon, objective, policy, model/config safe
   label, study/run status, started/finished timestamps and budget fields.
3. A candidate-selection comparison group key with independently verified
   shared dataset, horizon, fold, metric, baseline and evaluation window.
4. A distinct independent evaluation result and sealed-final-test status,
   with missing/no-permission states preserved.
5. Sanitized, approved report registry plus public-safe section payloads
   and **separate** optional approved document download; final report count
   should come from this registry only.
6. Provenance-safe event lineage and resource observations, if recorded.

**Do not** leak raw Source/Dataset/Plan PINs, unredacted study files,
source locations, checkpoints, held-out finals, market data or model weights.
The web must not launch studies, select champions, trade or schedule 24/7.
When absent, surface unsupported or unavailable, never fake data.

## Web integration completion definition

The existing DonghakStockVision 35-route inventory is a map of route declarations,
not a full functional or real-data E2E certificate. The AI Research Lab does not
replace backend API parity: every public API feature must be usable with
permission-appropriate controls and tested against the real operator backend
before declaring the entire TrisMarketLens project complete.

CI checks lint, TS, unit and mock browser E2E; only a user-operated Mac with
configured local sources can validate private real-study HTTP behavior.
