# Integrated research workspace and operator-only verification

This web-only implementation combines already-published backend evidence in
`/research-status` without changing any DonghakStockVision backend files.

## Research workspace

The route reports independent backend transport, authenticated LLM management,
comparison publication and selected-ticker daily research. Selecting a
six-character ticker fetches only the first 10 **validated** daily research
records. The actual published `totalRecords` is shown separately. The workspace
displays current/default/last-applied research LLM identities, the current
selection version and busy state, plus counts of **exact-contract** comparisons.
Unclassified comparisons remain separate. The latest 10 records are described
by completion state, model/version, trading date and real/synthetic origin.

Empty, unreachable, unauthorized, disabled and demonstration states are not
interchangeable. A selected model is not an applied model; a completed research
run is not a verified investment prediction. No autonomous Experiment Memory
payload or forecast return is invented.

## One-command private backend contract check

Only an operator who owns a **running, approved local backend** should run this
check. Use an existing `.env.local` in the web repo, with:

```env
MARKET_LENS_DATA_SOURCE=http
MARKET_LENS_DAILY_RESEARCH_SOURCE=http
DONGHAK_API_BASE_URL=http://127.0.0.1:8000
MARKET_LENS_VERIFY_TICKER=005930
```

The address and ticker above are examples, not assertions of a running
service or retained analysis. Optionally provide an existing read-scoped
management token in **server-only** variables:

```env
DONGHAK_AI_MANAGEMENT_BASE_URL=http://127.0.0.1:8001/
DONGHAK_AI_MANAGEMENT_TOKEN=<existing-read-token>
```

Verify without modifying the backend:

```bash
npm run verify:research:workspace
```

This script issues bounded GET requests only to literal loopback HTTP origins.
It checks the read-only health contract, Daily Research series identity,
pagination, origin/usage, status and the explicit lack of trading/forecast
approval. If management is configured, it checks the catalog, active selection,
comparison and change-history read endpoints with the existing token.
No model validation, selection, research execution, provider acquisition,
deployment or trading occurs. Logs include aggregate counts only, never a
credential, source body or private research records.

The integration command is **not run in public GitHub CI** because private
local services and authentication are unavailable there. CI checks TypeScript,
unit tests, build, browser flows with controlled mocks, and verifier syntax.
A passing offline suite does **not** certify private HTTP connectivity or
research quality.

## Web transport boundary

The Daily Research adapter accepts only explicitly configured local loopback
HTTP endpoints and rejects remote hosts, userinfo, arbitrary paths and
redirects. The management adapter independently requires literal
`127.0.0.1`. Any future hosted configuration must use a separately reviewed,
authenticated gateway; never weaken loopback guards as a workaround.

## Operator verification suite: diagnosis by stage

The operator command now uses the same bounded contract checks as offline Node tests. The first validated publication page is checked against the second page when one exists (maximum two pages of ten records each). A changing total, missing record, duplicate job reference, or unexpected date order fails the check without printing research contents. Results distinguish the first-page preview counts from the total number of published records. The script **does not** claim a full-history audit.

Use `npm run verify:research:workspace` with the existing local configuration. A successful run reports JSON with `outcome: passed`, `dailyResearch.checkedPages` and the optional `management` status. A failure reports `outcome: failed`, a bounded `stage`, and a sanitized reason; it exits nonzero. No bearer token, raw source response, job identifier, or authorization header is output.

The optional management check reads the catalog, active model, selection history, and comparison history through authenticated GET requests. It can distinguish authentication failure (401), missing permission (403), publication unavailable (503), invalid JSON, malformed management data, and invalid selection version. It never starts model validation or changes the selection. For comparison studies, the endpoint response only proves retained entries exist; equal `comparisonContractId` still does not prove prediction quality.

Run `npm run verify:research:contracts` to exercise both the pure contract validator and a controlled local HTTP server that simulates the actual operator command, including a changing daily research page and a forbidden management endpoint. These regression tests run during the required GitHub CI verifier step; they do not require the private macOS backend. The web's `/research-status` page also shows source-specific next checks, with read-only links to existing diagnostics and the local command, without executing that command in the browser.

If no local backend is running, the actual operator verification remains **unverified**, even when CI succeeds. Never weaken loopback restrictions or publish a token merely to make the verifier pass.
