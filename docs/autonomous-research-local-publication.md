# Autonomous research: local-only retained result publication

## Scope

The actual autonomous experiment engine stores `autonomous_run`, `autonomous_result`,
`autonomous_selection`, and `autonomous_terminal` in its own retained
`experiments.sqlite3` databases under `~/KRX-Private/Research`. The existing
daily research endpoint is a **different** snapshot-backed service and can return
HTTP 503 even while the autonomous study DBs contain real records. The existing
authenticated `/api/v1/ai/models/comparisons` endpoint is for managed LLM
comparison entries, not a general purpose Experiment Memory HTTP API.

This web implementation deliberately **does not** modify the DonghakStockVision
repository or start a new backend listener. It creates an operator-controlled
local read-only *publication file*, not a live API. The publication is refreshed
only when the operator explicitly runs the exporter. No automatic monitoring,
periodic scheduler, or training is added.

## Operator setup

From the current TrisMarketLens `main` checkout on the same Mac as the
existing private research files:

```bash
npm ci
npm run verify:autonomous:export
```

The export command uses Python 3's standard library. It scans up to 40
**non-symlink** immediate study directories, reads each quiescent, bounded
SQLite source through read-only immutable connections, and projects four kinds
of retained records. A source with an active WAL/journal sidecar is **skipped**,
rather than hot-copied. An already running experimental study remains unchanged.
The JSON file is atomically written with permissions `0600` to this fixed path:

```
~/Library/Application Support/TrisMarketLens/autonomous-research-publication.json
```

This output is a **separate, generated web publication**. It never replaces,
alters, or renames the original SQLite DB, PINs, checkpoints, model weights or
research snapshots. The exporter prints only aggregate counts, not the source
payload or original file paths.

Then add this line to the **existing** web `.env.local`:

```env
MARKET_LENS_AUTONOMOUS_RESEARCH_SOURCE=local_snapshot
```

Do not remove the market HTTP settings used by the other web screens. Restart
the existing Next.js process (ServerManager if applicable) so the new environment
variable is loaded. Open `http://127.0.0.1:3000/autonomous-research`, or follow
the research status link. You do **not** need to re-run or re-train experiments
to view retained data.

To publish newly completed research later, rerun the export command explicitly.
If it cannot read any eligible quiescent experiment databases, no new report
is written. The existing report may then be stale: check the displayed generated
timestamp.

## Contract and redaction

The local exporter emits `autonomous_research_local_publication_v1`. The
publication contains an operator-local timestamp, per-study **folder label**
(not its absolute path), retained artifact counts, and bounded whitelisted
summary fields only:

- Run: agent/state, recorded time, attempts/completed/failed, training/cache
  counts and explicit false/true approval flags.
- Result: mean AP, stability AP, worst balanced accuracy, train gap, approval
  flags and booleans recording the **presence** of optional deferred,
  generalization, and robustness objects.
- Selection: state, agent, timestamp and history count.
- Terminal: state, timing and safe summary metrics.

Original source fingerprints, SHA hashes, reference identifiers,
checkpoint paths, dataset IDs, selection candidate views, LLM proposal
prompts, raw features, per-fold private research data, and source PINs are
not copied to the publication. Per-kind records are capped at 500 per study.
A partial/skipped condition is visible. The web reader validates the
entire aggregate schema, enforces 2 MiB maximum payload, rejects symlinks
and overly broad file permissions, and does not expose arbitrary input
paths or credentials to browser clients.

Any retrospective research score is **descriptive only**. Different datasets,
study scopes, or confirmation/test periods must not be ranked as though
their APs are directly comparable. A recorded deferred diagnostic does not
certify generalization. The publication does not claim PIT, live price
prediction, independent future performance, or investment authorization.

## Verification

```bash
npm run verify:autonomous:tests
npm run check
```

GitHub CI runs these offline and also runs the standard mocked browser E2E suite.
The exporter test uses a temporary synthetic SQLite fixture to confirm that
source bytes remain unchanged, 0600 output is used, sensitive fields are
excluded, and an active sidecar is not published. CI cannot access the actual
operator's private research DBs and cannot claim a live local research export
has succeeded. The owner-run export command is the final integration step.
