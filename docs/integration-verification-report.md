# Integration verification report

Generate an explicit operator-reported status file without contacting the backend:

```bash
VERIFY_CI_STATUS=passed VERIFY_CI_URL=https://github.com/iosdevbyul/TrisMarketLens/actions/runs/<run-id> \
VERIFY_HTTP_STATUS=not_run VERIFY_EXTENSIONS_STATUS=not_run VERIFY_EVIDENCE_STATUS=not_run \
VERIFY_COMMIT=<commit-sha> VERIFY_PR=<pr-number> \
npm run verify:report -- verification-local.json
```

Optional metadata: `MARKET_LENS_VERIFY_TICKER`, `VERIFY_SNAPSHOT_ID`, `VERIFY_NOTES`.

Each status must be explicitly `passed`, `failed`, or `not_run`; all default to `not_run`. The command never performs CI, network checks or evidence verification. Set each `passed` status only after independently checking the associated evidence. Report creation refuses to overwrite an existing JSON file. Keep the report local and redact private dataset identifiers before sharing.

Required gates: CI, research/frontend HTTP check (`npm run verify:http`), extended HTTP check (`npm run verify:extensions`) and immutable-evidence/authorization review. A green CI never automatically marks the other gates successful.

The generated JSON is a bookkeeping artifact, **not** an approval or a signed provenance attestation.
