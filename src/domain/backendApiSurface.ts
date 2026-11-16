/**
 * Static inventory verified against DonghakStockVision api/app.py,
 * api/historical_portfolio_routes.py and ai_model_routes.py on 2026-11-17.
 * A mapped UI is NOT proof that the operator enabled the backend publication.
 * New backend routes must be added here and classified before declaring parity.
 */
export type ApiSurface = {
  method:"GET"|"POST"|"PUT";
  endpoint:string;
  group:"Core"|"Security metadata"|"Market & research"|"Operations"|"Portfolios"|"AI management";
  status:"ui_mapped"|"partial"|"pending";
  href:string|null;
  note:string;
};
export const BACKEND_API_SURFACE:readonly ApiSurface[]=[
  {method:"GET",endpoint:"/api/v1/health",group:"Core",status:"ui_mapped",href:"/diagnostics",note:"Connection health, not source verification"},
  {method:"GET",endpoint:"/api/v1/project/status",group:"Core",status:"ui_mapped",href:"/",note:"Snapshot-only research project"},
  {method:"GET",endpoint:"/api/v1/research/coverage",group:"Core",status:"ui_mapped",href:"/stocks",note:"Reviewed research universe"},
  {method:"GET",endpoint:"/api/v1/models",group:"Core",status:"ui_mapped",href:"/models",note:"Stock direction model summaries"},
  {method:"GET",endpoint:"/api/v1/models/{direction}",group:"Core",status:"ui_mapped",href:"/models",note:"Per-direction evidence"},
  {method:"GET",endpoint:"/api/v1/evidence",group:"Core",status:"ui_mapped",href:"/evidence",note:"Evidence layers"},
  {method:"GET",endpoint:"/api/v1/evidence/{layer}",group:"Core",status:"ui_mapped",href:"/evidence",note:"Evidence details"},
  {method:"GET",endpoint:"/api/v1/backtests/baseline",group:"Core",status:"ui_mapped",href:"/backtesting",note:"Baseline research backtest"},
  {method:"GET",endpoint:"/api/v1/stocks",group:"Core",status:"ui_mapped",href:"/stocks",note:"Research snapshot ticker list"},
  {method:"GET",endpoint:"/api/v1/stocks/{ticker}",group:"Core",status:"ui_mapped",href:"/stocks",note:"Research ticker detail"},
  {method:"GET",endpoint:"/api/v1/security-metadata",group:"Security metadata",status:"ui_mapped",href:"/security-metadata",note:"Entire validated metadata envelope; optional publication"},
  {method:"GET",endpoint:"/api/v1/security-metadata/{ticker}",group:"Security metadata",status:"ui_mapped",href:"/stocks",note:"Single ticker verified metadata; optional publication"},
  {method:"GET",endpoint:"/api/v1/analysis/screener",group:"Market & research",status:"ui_mapped",href:"/screener",note:"Reviewed screener publication"},
  {method:"GET",endpoint:"/api/v1/stocks/{ticker}/ohlcv",group:"Market & research",status:"ui_mapped",href:"/stocks",note:"Research OHLCV reader"},
  {method:"GET",endpoint:"/api/v1/operational/summary",group:"Market & research",status:"ui_mapped",href:"/operational-market",note:"Unreviewed operational market summary"},
  {method:"GET",endpoint:"/api/v1/operational/stocks",group:"Market & research",status:"ui_mapped",href:"/operational-market",note:"Operational ticker catalog"},
  {method:"GET",endpoint:"/api/v1/operational/stocks/{ticker}/ohlcv",group:"Market & research",status:"ui_mapped",href:"/operational-market",note:"Operational OHLCV only"},
  {method:"GET",endpoint:"/api/v1/stocks/{ticker}/research-analysis",group:"Market & research",status:"ui_mapped",href:"/research-status",note:"Daily Research: separate source, may return HTTP 503"},
  {method:"GET",endpoint:"/api/v1/stocks/{ticker}/analysis",group:"Market & research",status:"ui_mapped",href:"/research-workbench",note:"Published ticker analysis"},
  {method:"GET",endpoint:"/api/v1/operations/krx-scheduler/diagnostics",group:"Operations",status:"ui_mapped",href:"/operations",note:"Optional KRX scheduler diagnostics"},
  {method:"GET",endpoint:"/api/v1/operations/runs",group:"Operations",status:"ui_mapped",href:"/operations",note:"Read-only recorded operations"},
  {method:"GET",endpoint:"/api/v1/operations/freshness",group:"Operations",status:"ui_mapped",href:"/operations",note:"Freshness projection"},
  {method:"GET",endpoint:"/api/v1/operations/alerts",group:"Operations",status:"ui_mapped",href:"/operations",note:"Alert projection"},
  {method:"GET",endpoint:"/api/v1/research/historical-portfolios",group:"Portfolios",status:"ui_mapped",href:"/backtesting/portfolios",note:"Read-only retained portfolio report list"},
  {method:"POST",endpoint:"/api/v1/research/historical-portfolios/compare",group:"Portfolios",status:"ui_mapped",href:"/backtesting/portfolios",note:"Explicit read-only historical comparison"},
  {method:"GET",endpoint:"/api/v1/research/historical-portfolios/{report_id}",group:"Portfolios",status:"ui_mapped",href:"/backtesting/portfolios",note:"One historical report"},
  {method:"GET",endpoint:"/api/v1/research/historical-portfolios/{report_id}/tickers/{ticker}",group:"Portfolios",status:"ui_mapped",href:"/backtesting/portfolios",note:"Ticker drilldown"},
  {method:"GET",endpoint:"/api/v1/research/historical-portfolios/{report_id}/trades",group:"Portfolios",status:"ui_mapped",href:"/backtesting/portfolios",note:"Simulated historical trades"},
  {method:"GET",endpoint:"/api/v1/ai/models",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Requires authenticated ai:read token"},
  {method:"GET",endpoint:"/api/v1/ai/models/active",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"LLM selection status"},
  {method:"POST",endpoint:"/api/v1/ai/models/validate",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Explicit ai:manage validation request"},
  {method:"GET",endpoint:"/api/v1/ai/models/validations/{identifier}",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Read validation outcome"},
  {method:"PUT",endpoint:"/api/v1/ai/models/active",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Explicit approved selection for next run"},
  {method:"GET",endpoint:"/api/v1/ai/models/comparisons",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Managed LLM comparison, not all autonomous experiments"},
  {method:"GET",endpoint:"/api/v1/ai/models/history",group:"AI management",status:"ui_mapped",href:"/ai-research-models",note:"Model management action history"},
];
export const apiSurfaceTotals=()=>({
  total:BACKEND_API_SURFACE.length,
  mapped:BACKEND_API_SURFACE.filter(item=>item.status==="ui_mapped").length,
  partial:BACKEND_API_SURFACE.filter(item=>item.status==="partial").length,
  pending:BACKEND_API_SURFACE.filter(item=>item.status==="pending").length,
});
