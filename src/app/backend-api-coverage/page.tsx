import { Localize } from "@/i18n/Localize";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { BACKEND_API_SURFACE, apiSurfaceTotals } from "@/domain/backendApiSurface";

export default function BackendAPICoveragePage(){
  const totals=apiSurfaceTotals();
  const groups=[...new Set(BACKEND_API_SURFACE.map(item=>item.group))];
  return <>
    <Link className="back-link" href="/diagnostics"><Localize text="← Back to backend diagnostics"/></Link>
    <PageHeader eyebrow="Development integration audit" title="DonghakStockVision API coverage"
      badge="Route mapping · verification pending"
      description="Every current documented backend HTTP route is tracked here. Mapped means the web has a corresponding feature surface, NOT that its private runtime has been tested end-to-end or that every optional backend publication is configured."/>
    <section className="panel single-panel" aria-label="Backend API inventory summary">
      <div className="panel-heading"><h2><Localize text="Integration inventory" /></h2><span className="panel-count"><Localize text="Source: backend route implementations" /></span></div>
      <div className="operations-overview-grid">
        {([
          ["Known backend HTTP routes",totals.total],
          ["Web feature surfaces mapped",totals.mapped],
          ["Partially mapped",totals.partial],
          ["Missing web feature surfaces",totals.pending],
        ] as const).map(([label,count])=>
          <div className="operations-overview-stat" key={label}><span><Localize text={label}/></span><strong>{count}</strong></div>)}
      </div>
      <p className="section-copy">
        Route mapping is only an inventory milestone. Product completion also requires a usable
        per-operation web flow, correct authentication and authorization, validated response
        handling, real local HTTP E2E, tests, and graceful handling of optional or unavailable data.
        Autonomously retained experiments use a separate operator-generated local publication;
        the backend has no general Experiment Memory HTTP endpoint in this inventory.
      </p>
      <p className="metric-detail"><Localize text="Source files: api/app.py, api/historical_portfolio_routes.py and ai_model_routes.py. Last reviewed 2026-11-17. Newly introduced backend routes must be added and audited before declaring full API parity." /></p>
    </section>
    {groups.map(group=><section className="panel single-panel" aria-label={group+" API integration"} key={group}>
      <div className="panel-heading"><h2><Localize text={group}/></h2><span className="panel-count">{BACKEND_API_SURFACE.filter(item=>item.group===group).length} routes</span></div>
      <div className="status-list">
        {BACKEND_API_SURFACE.filter(item=>item.group===group).map(item=>
          <article className="status-row" key={item.method+" "+item.endpoint}>
            <div style={{minWidth:0,overflowWrap:"anywhere"}}>
              <p className="status-title"><code>{item.method} {item.endpoint}</code></p>
              <p className="status-detail"><Localize text={item.note}/></p>
              {item.href?<p className="metric-detail"><Link href={item.href}><Localize text="Inspect mapped web feature" /></Link></p>:null}
            </div>
            <span className="status-pill" data-state={item.status==="ui_mapped"?"in_progress":"blocked"}>
              <Localize text={item.status==="ui_mapped"?"Mapped / E2E pending":item.status}/>
            </span>
          </article>)}
      </div>
    </section>)}
  </>;
}
