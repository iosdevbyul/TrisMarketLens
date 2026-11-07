import { NextResponse } from "next/server";

import { loadOperationalCatalog } from "@/data/OperationalMarketDataSource";
import { checkBackendHealth } from "@/data/backendHealth";

export const dynamic = "force-dynamic";
const NO_STORE = {"Cache-Control":"no-store, max-age=0"};

export async function GET() {
  const dataSource = process.env.MARKET_LENS_DATA_SOURCE ?? "mock";

  if (dataSource !== "http" && dataSource !== "mock") {
    return NextResponse.json({status:"degraded",app:"TrisMarketLens",dataSource:"invalid",backend:{status:"misconfigured"},operationalMarket:{status:"not_configured",observedTickers:null}}, {status:503,headers:NO_STORE});
  }

  if (dataSource === "mock") {
    return NextResponse.json({
      status: "ok",
      app: "TrisMarketLens",
      dataSource,
      backend: {
        status: "not_required",
      },
      operationalMarket: { status: "not_configured", observedTickers: null },
    }, {headers:NO_STORE});
  }

  const [backend, operational] = await Promise.all([
    checkBackendHealth(process.env.DONGHAK_API_BASE_URL),
    loadOperationalCatalog(process.env.DONGHAK_API_BASE_URL),
  ]);
  const healthy = backend.status === "ok";
  const operationalMarket = operational.data
    ? { status: operational.data.total > 0 ? "available" : "empty", observedTickers: operational.data.total, evidenceStatus: "unreviewed" }
    : { status: "unavailable", observedTickers: null };

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "TrisMarketLens",
      dataSource,
      backend,
      operationalMarket,
    },
    { status: healthy ? 200 : 503, headers: NO_STORE },
  );
}
