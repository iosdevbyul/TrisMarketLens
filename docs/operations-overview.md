# Operations overview

The Operations overview reuses three existing independent read-only adapters: Operations, exchange-calendar Freshness, and Operational Alerts. It does not make a new API call.

State precedence: confirmed active incidents, delayed validated data, or failed/blocked pipeline => **needs attention**. Reported running pipeline => **in progress** unless attention is already known. **Reported healthy** requires all three sources accessible, pipeline stages explicitly successful, freshness explicitly current, and no open backend alert records. Everything else => **unknown**. This is only a summary of backend-provided reports, not an independent end-to-end health guarantee or freshness SLA certification.

Missing alert data is **unknown**, never zero. Fictional mock inputs are identified explicitly. This PR does not create or resolve incidents, send notifications, or modify DonghakStockVision.

## Evidence issue overview handoff

The **Copy overview handoff** action within the recorded-run explorer includes the
explicit evidence issue share: `(invalid + unavailable) / all API-returned executions`.
The percentage is rounded to the nearest whole percent. The denominator includes
validated, partial, and unrecorded evidence outcomes, not only issue records.
For zero returned executions, the share is **Unavailable**, never an inferred 0%.
Inconsistent category counts or totals fail closed. This is a bounded observed
recording share, **not** incident frequency, failure rate, lifetime coverage,
validation success or investment approval. The copy contains no synthetic market
data or operational writes.
