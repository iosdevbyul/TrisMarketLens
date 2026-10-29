# Inspect a saved integration verification report

Use the report generator before inspection, after explicitly recording which checks were performed:

```bash
npm run verify:report -- verification-local.json
npm run verify:inspect -- verification-local.json
```

Exit codes from the inspector:
- `0`: all four statuses were entered as passed by the operator; this is **not independent certification**
- `2`: at least one gate was marked failed
- `3`: no failure but one or more gates were not run
- Other nonzero: malformed report, contradictory status list or unreadable file

The inspector accepts a local filename only and never contacts the network, validates backend provenance or changes a report. It verifies that `unverified` exactly agrees with the four gate statuses to expose contradictory bookkeeping. For a real backend check, follow `docs/verification-gates.md` and record the check results separately.
