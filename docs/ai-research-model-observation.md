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

The server sends the bearer token only when fetching the existing `GET /api/v1/ai/models`, `/active`, `/history` and `/comparisons` endpoints. It never returns the token or a raw upstream error to the browser. Responses are requested without caching and redirects are rejected. Read-only operations require the backend `ai:read` scope.

## Semantics and safety

- Unconfigured, unreachable, rejected credentials and insufficient scopes are distinct visible states.
- If required catalog/active requests fail, no model status is fabricated. Optional history/comparison failures are identified separately.
- Installed, configured, reachable, executable, selected and actually applied research models are different concepts. The page must not portray model validation as research success.
- Model selection is **not** a UI operation in this initial observer. Subsequent mutations require a separate approved authenticated design with explicit user confirmation, version compare-and-set, validation receipt and busy/lease handling.
- The page is intentionally a local operator feature; it is not an authenticated multi-user web administration portal or approval for LAN/cloud hosting.
- Models and comparisons listed here are research infrastructure/evidence, never investment recommendations.

## Verification

`npm run check` validates the existing web code. CI uses offline fixtures; it cannot confirm connectivity to the operator's private management service. When that service is explicitly configured, manually open `http://127.0.0.1:3000/ai-research-models` and verify the real authenticated observations and absence of tokens in browser requests.
