import { NextResponse } from "next/server";

import { checkBackendHealth } from "@/data/backendHealth";

export async function GET() {
  const dataSource = process.env.MARKET_LENS_DATA_SOURCE ?? "mock";

  if (dataSource !== "http") {
    return NextResponse.json({
      status: "ok",
      app: "TrisMarketLens",
      dataSource,
      backend: {
        status: "not_required",
      },
    });
  }

  const backend = await checkBackendHealth(process.env.DONGHAK_API_BASE_URL);
  const healthy = backend.status === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "TrisMarketLens",
      dataSource,
      backend,
    },
    { status: healthy ? 200 : 503 },
  );
}
