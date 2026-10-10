# Prediction evaluation read-only contract

Frontend only. A completed prediction may be evaluated only under an approved, versioned DonghakStockVision policy. The web does not decide whether a prediction is correct based on price differences.

Use `MARKET_LENS_EVALUATION_SOURCE=disconnected|mock|http` (default disconnected); HTTP requests `GET /api/v1/stocks/{ticker}/evaluations` from `DONGHAK_API_BASE_URL`. Endpoint is future backend work. Mock prices and returns are fictional, labeled, and separate from actual results.

Schema: `{ticker, evaluations:[{id,analysisId,ticker,evaluatedAt,horizonSessions,referenceDate,referencePrice,evaluationDate,evaluationPrice,realizedReturn,verdict,policyId,explanation}]}`. Verdicts: `pending`, `inconclusive`, `correct`, `incorrect`. Date fields use YYYY-MM-DD, timestamp uses ISO 8601 offset, null means unknown. Realized returns use fractions (0.02 means 2%). HTTP errors or untrusted response shapes show no results.
