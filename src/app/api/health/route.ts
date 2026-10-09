import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "TrisMarketLens",
    dataSource: process.env.MARKET_LENS_DATA_SOURCE ?? "mock",
  });
}
