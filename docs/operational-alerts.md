# Operational alerts (read-only)

Alerts are received from a future `GET /api/v1/operations/alerts` endpoint. Configure `MARKET_LENS_ALERTS_SOURCE=disconnected|mock|http` (default disconnected). Mock alerts are fictional; errors produce empty lists, not fabricated healthy states.

Each record contains `id`, `category` (freshness/pipeline/inference/other), `severity` (info/warning/critical), `status` (open/resolved), `title`, `description`, `occurredAt`, `resolvedAt` and `relatedRunId`. Backend retains authority for incident detection, severity classification, acknowledgment/resolution, and sending notifications. This PR never mutates incident state.
