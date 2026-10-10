# Research API transport security policy

## Local baseline

DonghakStockVision's currently implemented read-only FastAPI has no authentication dependency and binds to `127.0.0.1:8000` by default. **Keep it loopback-only.** Do not expose this unauthenticated service directly to the Internet. CORS is not an access-control substitute.

## Public deployment prerequisite (not implemented by this PR)

Before remote exposure, require HTTPS, identity-aware gateway or authenticated server-to-server proxy, scoped read-only authorization, rate limiting, request size limits, safe error redaction, and audit logging. Keep secrets server-side; do not place credentials in `NEXT_PUBLIC_*` variables or client components. Plan for key rotation and credential revocation. Approve gateway access rules in a separate backend/infrastructure PR before changing the bind address.

## Frontend request behavior

The core `HttpDataSource` uses an AbortSignal timeout of 5 seconds, disables HTTP caching, validates response shapes at runtime and fails closed with `HttpDataSourceError`. 404 maps to null only for detail lookups. Network errors and timeouts remain failures, not mock fallback. No authorization header is introduced without a corresponding backend authentication contract.

## Deliberate limitations

This work does not implement backend authentication, deploy an API gateway, add tokens, or assert remote network security. Runtime validators verify wire shape, not model accuracy, business policy or true market freshness. Live end-to-end verification remains separate.
