# Pipeline health (frontend)

The operations UI groups **recorded job events** from the existing `GET /api/v1/operations` data contract into collection, validation, and inference. It recognizes only explicit pipeline names; unknown names are not classified. A stage's most recent run and last recorded successful completion are kept separately so later failures do not erase success history.

The overview state is **reported successful** only when all three stages have recorded success and the Operations connection is connected. This status does not guarantee workflow causality, current-day freshness, or end-to-end integrity; these require explicit backend contracts. Missing stages, disconnected state, and absent timestamps never become green success states.

Use `MARKET_LENS_OPERATIONS_SOURCE=mock` for clearly labeled fictional sample runs. Actual scheduling, retries, freshness SLA rules, holidays, and backend pipeline orchestration remain outside this frontend PR.
