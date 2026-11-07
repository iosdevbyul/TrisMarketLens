# Chromium browser E2E automation

This suite uses **Playwright 1.56.1** to exercise real Chromium browser
interactions on the web application. Tests run against the web's local,
controlled mock/demo mode. They **never** contact DonghakStockVision, collect
market prices, initiate trades, start local Docker or require paid services.

## GitHub Actions

The existing `.github/workflows/ci.yml` `checks` job runs the browser tests
**after** dependency audit, lint, TypeScript, Vitest, offline script syntax
checks, and `next build`. Browser failures therefore fail the existing CI
job and block CI-gated auto-merge. The workflow installs a pinned Playwright
runner and Chromium on ubuntu-latest. On failure it uploads the HTML report,
screenshots and Playwright traces as a seven-day `playwright-e2e-failures`
artifact.

The pinned Playwright runner is installed in a separate temporary npm prefix,
then its modules and CLI are symlinked into the checkout for the E2E job.
This avoids modifying the dependency graph installed by `npm ci`, keeps the
application lockfile unchanged, and does not add Playwright to production.

Browsers: Chromium desktop (1280x720, English) and Chromium mobile-emulated
390x844 (English). They are **emulations**, not physical iPhone or Android tests.

## What it actually checks

- Main navigation and routes: overview → stocks → models → evidence
- Keyboard-only skip-to-main landmark and mobile navigation
- Stock explorer search, empty results, clear search, stock detail link
- Research path query selection and seven recorded-evidence stage links
- Screener search empty/restore, direction filter, explicit fictional label
- Model workbench demo provenance, no invented HTTP-correspondence claim
- Operations → collection/research trace and diagnostics in mock mode
- Historical portfolio archive correctly reports real HTTP publication unavailable
- Health JSON explicitly identifies mock source instead of claiming backend health

## Run on a local developer machine

Use a supported recent OS/Node.js 22 environment with Playwright Chromium
dependencies available. Do not add or commit local secrets.

```bash
npm ci
npm run build
runner_dir="$(mktemp -d)"
npm install --prefix "$runner_dir" --no-save --package-lock=false --ignore-scripts @playwright/test@1.56.1
mkdir -p node_modules/@playwright
ln -s "$runner_dir/node_modules/@playwright/test" node_modules/@playwright/test
ln -s "$runner_dir/node_modules/playwright" node_modules/playwright
ln -s "$runner_dir/node_modules/playwright-core" node_modules/playwright-core
ln -s "$runner_dir/node_modules/.bin/playwright" node_modules/.bin/playwright
npx playwright install chromium
npm run test:e2e
```

The Playwright configuration starts `npm run start` on
`http://127.0.0.1:3000`, sets mock-only source flags, and shuts it down
after the tests. The web project itself remains bound to loopback. Do not
point these tests at real local backend data or a public deployment.

To inspect a failed test locally, run `npx playwright show-report` or
`npx playwright show-trace <trace.zip>` on the retained test result.

## Deliberate boundaries

- No backend or financial-source correctness tested
- No review of KRX prices, financial returns, model accuracy or trading approval
- No real portfolio publication comparison POST without operator fixtures
- No physical mobile device, OS accessibility audit or live security test
- Any live operator-side HTTP E2E remains the separate documented P1/P5 gate

A green Chromium result means the **mock-mode browser journeys tested here**
work on the CI runner. It is not a release certificate for live financial data
or public deployment.
