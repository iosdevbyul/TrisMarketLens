# Donghak AI Research Lab — local real-data smoke verification

This procedure verifies the approved read-only six-Study Research Lab contract from TrisMarketLens. It **does not** publish or modify any DonghakStockVision data, start research, access raw PINs, open Final Test, or authorize trading.

## Preconditions

- DonghakStockVision API is already running on loopback (normally `127.0.0.1:8000`) with the operator-approved `--research-lab-root` and independently approved `--research-lab-index-sha256` flags. Keep existing snapshot and operational-snapshot flags intact.
- `.env.local` sets `DONGHAK_API_BASE_URL=http://127.0.0.1:8000`. The verifier rejects remote hosts, URL credentials, extra paths, and redirects.
- The six finalized historical-expansion revision2 studies have been exported and independently verified by the local operator. This script never creates or approves that archive.

From the **TrisMarketLens** root run:

```sh
npm run verify:research:lab
```

A successful run returns `RESEARCH_LAB_READ_ONLY_HTTP_VERIFIED` with 6 approved Study identities, 72 original completed Experiment identities, 6 final reports, 2 cohort-matched comparison groups, and the number of retained Experiment Memory events. It validates the list, each Study detail, each Experiment catalog, a selected Experiment detail, each Study Memory, every final report detail, and policy comparison boundaries. Failures exit nonzero without returning private raw data.

This script validates the currently approved six-Study publication **only**. A later publication with different study counts requires a separately reviewed verifier update. It is not a historical market-data completeness check or independent performance audit.

## Browser follow-up

At `http://127.0.0.1:3000/ai-research-lab`, review the six studies, one Study's selected model/fold metrics and Experiment Memory, a final report, and the two cohort-matched comparison groups. On both desktop and narrow viewport, the **과거 연구 완료** status must be compact text, not a large circular red warning. An experiment being completed does not mean the model is independently validated, PIT-qualified, performance-approved, or permitted for execution.

This is a local operator-only verification. Do not expose the backend via a public reverse proxy.
