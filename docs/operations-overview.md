# Operations overview

The Operations overview reuses three existing independent read-only adapters: Operations, exchange-calendar Freshness, and Operational Alerts. It does not make a new API call.

State precedence: confirmed active incidents, delayed validated data, or failed/blocked pipeline => **needs attention**. Reported running pipeline => **in progress** unless attention is already known. **Reported healthy** requires all three sources accessible, pipeline stages explicitly successful, freshness explicitly current, and no open backend alert records. Everything else => **unknown**. This is only a summary of backend-provided reports, not an independent end-to-end health guarantee or freshness SLA certification.

Missing alert data is **unknown**, never zero. Fictional mock inputs are identified explicitly. This PR does not create or resolve incidents, send notifications, or modify DonghakStockVision.
