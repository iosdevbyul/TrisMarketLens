# AI Analysis History

The history screen groups the existing aggregated AI Screener records by `dataThrough` (the trading date used in analysis). It does **not** imply the model ran on that date: `latestAnalyzedAt` is shown separately.

Set `MARKET_LENS_SCREENER_SOURCE=mock` to explore fictional examples. With `http`, the screen reads the existing Screener aggregate adapter. When disconnected or unavailable, no activity is invented.

Missing dates are omitted rather than displayed as zero runs. The page charts the latest 30 observed dates and lets users inspect counts for model records, distinct securities, prediction directions, and validation states. This page does not evaluate prediction accuracy or execute trades.
