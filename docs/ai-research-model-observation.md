# AI research LLM observation (web)

The `/ai-research-models` route observes DonghakStockVision's **optional authenticated** AI research language-model management service. It is separate from `/models`, which displays trained stock-direction model evaluation.

## Setup

The existing Next.js process and the AI management service must run on the same operator-owned Mac. The backend management feature is opt-in and may be served on a different loopback port than the regular read-only snapshot API.

Configure the **server-only** variables in `.env.local`:

```env
DONGHAK_AI_MANAGEMENT_BASE_URL=http://127.0.0.1:8001/
DONGHAK_AI_MANAGEMENT_TOKEN=<existing-ai-read-scoped-token>
```

The port is illustrative: use the actual locally configured management listener. Never commit a real token or use `NEXT_PUBLIC_` for it. The frontend accepts only literal loopback IPv4 HTTP origins without paths, userinfo, query or fragments. It does not create the backend management configuration, install models, start a scheduler or modify DonghakStockVision.

The server sends the bearer token when fetching the existing `GET /api/v1/ai/models`, `/active`, `/history` and `/comparisons` endpoints. It never returns the token or a raw upstream error to the browser. Responses are requested without caching and redirects are rejected. Read-only operations require backend `ai:read`; validating or selecting requires `ai:manage`.

## Semantics and safety

- Unconfigured, unreachable, rejected credentials and insufficient scopes are distinct visible states.
- If required catalog/active requests fail, no model status is fabricated. Optional history/comparison failures are identified separately.
- Installed, configured, reachable, executable, selected and actually applied research models are different concepts. The page must not portray model validation as research success.
- The UI can request an asynchronous validation job, inspect its status, and select only a completed valid model with a backend validation receipt, explicit approval, and the current compare-and-set selection version. A stale selection, busy lease or rejected receipt remains unchanged.
- The mutation endpoints are invoked by Next.js server actions, not browser-side API calls. No arbitrary endpoint, model configuration, credentials or raw backend error text is accepted from the client. Validation does not itself change the selected model.
- The page is intentionally a local operator feature; it is not an authenticated multi-user web administration portal or approval for LAN/cloud hosting.
- Models and comparisons listed here are research infrastructure/evidence, never investment recommendations.

## Verification

`npm run check` validates the existing web code. CI uses offline fixtures; it cannot confirm connectivity to the operator's private management service. When that service is explicitly configured, manually open `http://127.0.0.1:3000/ai-research-models` and verify the real authenticated observations and absence of tokens in browser requests.

## Validation and selection workflow

Open `/ai-research-models`, request a validation for a registered model, and refresh the displayed job until it completes. Once the backend reports a valid outcome and an unexpired receipt, check the explicit approval box to submit a compare-and-set model selection. A model selection affects only **subsequent manually initiated managed studies**; neither validation nor selection starts research. On 409, refresh the page and re-evaluate the current model/version. 401/403 require the operator to supply correct server-side authentication. The example configuration must use an existing `ai:manage` scoped credential for these operations.

This is not a general-purpose multi-user administrative interface. Access should remain restricted to the local operator. Real validation jobs can consume CPU and memory; no blind retry is performed.

## Stock-detail research evidence comparison

The existing `/stocks/[ticker]` Daily Research panel now includes a model-wise comparison table for the **current validated response page**. The grouping key is `modelId + modelVersion + dataOrigin` so real-source and synthetic-fixture rows never share one count. The table shows observed trading-date coverage, recorded jobs, outcome status counts, and count of recorded research scores, with a separate disclosure for Up/Down/Neutral display labels. It does not average uncalibrated scores or infer return, success rate, ranking, trading readiness or autonomous Experiment Memory contents.

A page containing 50 of 300 retained records is always identified as 50 displayed records; comparisons do not silently claim to cover the 250 unrequested records. Unavailable or unconfigured publication leaves the section absent rather than replacing it with demonstration data. No backend API changes are needed.


## Bounded multi-page research comparison

Open `/stocks/{ticker}/research-comparison` from the existing stock detail screen. The route uses the independently reviewed daily research publication's existing inclusive `fromDate` and `toDate` filters. It sequentially fetches up to five consecutive `limit=200` pages, stopping after 1,000 records or when the full filtered publication has been retrieved.

Every page uses the current HTTP-only research adapter and its strict schema validator. A moving total, page-size mismatch, broken offset, non-monotonic date boundary, or duplicate job reference causes the complete comparison to be withheld. Disconnected or unpublished data never falls back to mock. The results distinguish `complete` (all matching published records) from `limited` (only first 1,000), and never call a partial count an all-history metric.

The comparison is descriptive only: job status, model and version identity, recorded date coverage, and real versus synthetic publication origins. It does not run autonomous experiments, expose private Experiment Memory, estimate model quality or compute investment performance. Historical publication counts reflect available backend records only, not an independently verified market history.

## Model-management comparison contracts

The authenticated `GET /api/v1/ai/models/comparisons` response is now displayed by backend-provided `comparisonContractId` groups. A record without a non-empty contract ID is explicitly unclassified and **never** merged into a scored group. Matching IDs permit a side-by-side view of retained run identities, state and any recorded reason, but are not independent proof of model quality or investment performance. A group containing only one run is labelled as such. Frontend code does not invent metrics or compare across contract fingerprints.

This page also correctly identifies its explicit server-action validation and selection controls rather than claiming the entire page only performs GET requests. Those controls remain operator-authenticated and bounded by the existing management API. Autonomous Experiment Memory itself still has no verified general-purpose HTTP publication contract and is not fabricated in the web UI.

## Integrated research source status

The web's `/research-status` route reports four independently checked sources: the read-only market backend's health endpoint, the authenticated research LLM model catalog, its optional comparison publication, and the selected ticker's daily research series. Source states distinguish available, empty, disconnected, unavailable, demonstration and not-checked.

A six-character ticker is required for per-stock daily research; leaving it blank does not query any stock record. The daily query uses a bounded `limit=10` response while showing the backend's `totalRecords` separately, so a preview count is not presented as comprehensive publication. Management tokens stay server-side. The page only performs GET requests; it does not initiate model validation, switch an LLM, execute research, or place trades.

Because autonomous Experiment Memory does not have a verified general-purpose HTTP publication contract, the integration explicitly labels it unavailable rather than fabricating private experimental data. The individual underlying screens remain available for detailed investigation.
