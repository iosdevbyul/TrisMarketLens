# Deployment and access readiness — P4

Scope: TrisMarketLens web only. Assessed against the current web source contracts and
DonghakStockVision read-only API documentation. **This review is not a public
deployment approval and does not mean a live penetration test was performed.**

## Decision

| Environment | Decision | Required controls |
| --- | --- | --- |
| Local single-operator browser, frontend `127.0.0.1:3000`, backend `127.0.0.1:8000` | **Conditionally allowed** | Run via documented local scripts, explicit HTTP mode and source configuration, validate real backend and browser before accepting data |
| LAN, shared laptop/browser, office Wi-Fi or remotely reachable bind address | **NO-GO** | Access control and threat review; do not rely on browser CORS, source mode or private URLs |
| Internet, cloud hosting, mobile remote access | **NO-GO** | Identity-aware gateway/authentication, HTTPS/TLS, scoped authorization, rate limits, audit logs, secrets management and approved deployment plan |
| Mock/demo mode | **Demo only** | Never interpret as market research or live operating evidence |

This repository does not provide user accounts, authentication, sessions,
permissions or an access gateway. **It is not ready for a public or network-shared
deployment.** Operator-owned local data may be confidential even when the HTTP
endpoints are read-only. Read-only does not mean public.

## Changes verified by offline CI

- `npm run dev` and `npm run start` bind to `127.0.0.1` by default.
  Do not override hostname or reverse-proxy these processes to the LAN/Internet.
  Manual port forwarding and tunneling are not approved.
- When global or per-feature HTTP sources are configured, `next.config.ts`
  fails startup if `DONGHAK_API_BASE_URL` is absent, non-HTTP or not an exact
  `localhost` / `127.0.0.1` base URL. The core server-side HTTP adapter
  and backend health checker enforce the same rule before requests. URL
  credentials, paths, queries and fragments are disallowed. This is not an
  authorization substitute for remote access.
- The backend health request uses `cache: no-store`, five-second timeout and
  exact `DonghakStockVision` / `read_only` service identity.
- Core backend transport errors no longer copy raw network exception messages
  or non-2xx response bodies. Web `/api/health` has `no-store` response
  policy, fails for unsupported source modes, and does not copy raw
  operational snapshot errors to callers.
- Existing local-only feature adapters, source validation, offline integration
  fixtures, and fail-closed absent/HTTP-503 presentation are retained.
  This PR does not assert that all specialized adapters have been independently
  penetration-tested or that infrastructure cannot override process binding.

## Authentication and secrets

There is **no legitimate authentication contract** to implement on this
frontend alone. Do not invent a password, client token, mock login or
`NEXT_PUBLIC_*` secret. If the operator later chooses remote hosting,
define and approve the identity provider, session/role policies, gateway,
least-privilege backend authorization and deployment architecture first.
Backend changes require their own separately authorized repository task.

Keep `.env.local` outside source control. Do not use backend URLs with
usernames/passwords, raw tokens, remote hosts, cloud metadata addresses,
private service names or arbitrary URL paths. Do not enable CORS as a substitute
for authentication.

## Operator release checks (not run by GitHub CI)

1. Run the read-only backend on loopback only; inspect the real listener
   with `lsof -nP -iTCP:8000 -sTCP:LISTEN`.
2. Set `MARKET_LENS_DATA_SOURCE=http` and
   `DONGHAK_API_BASE_URL=http://127.0.0.1:8000` locally.
3. Start the web using `npm run start` after `npm run build`.
   Confirm the web listener is on `127.0.0.1:3000`, not `0.0.0.0`.
4. Inspect source status and missing optional publications in
   `/diagnostics`; never treat HTTP health as research approval.
5. Run `npm run verify:integration:audit` only on a machine with the
   operator-owned backend/web services actually running; record every
   `not_tested`, `unconfigured` and `failed` check without hiding it.
6. Test network isolation from another device; it must not reach the web
   or backend. If it can, STOP and fix binding/firewall before processing
   operator data.
7. Review deployment logs and CI for inadvertent credentials or source
   information. Repeat the checks after network/configuration changes.

## Residual risks and next gate

CI only exercises **offline deterministic tests**, TypeScript, lint and build.
It does not inspect cloud or workstation firewalls, installed reverse proxies,
OS permissions, real tokens, active browser sessions, remote DNS resolution,
headers set by deployment infrastructure, or backend ownership. Dedicated
read-only HTTP endpoints may still carry sensitive research evidence.
If any non-loopback deployment is requested, treat P4 as **NO-GO** pending
a separately approved security architecture and E2E penetration review.
P5 should use this document as a release gate rather than claiming all
security concerns were resolved by green CI.
