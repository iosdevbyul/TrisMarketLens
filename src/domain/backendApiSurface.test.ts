import { describe, expect, it } from "vitest";
import { BACKEND_API_SURFACE, apiSurfaceTotals } from "./backendApiSurface";
describe("DonghakStockVision API parity inventory",()=>{
  it("covers all explicitly audited backend route declarations without duplicate method/path",()=>{
    expect(BACKEND_API_SURFACE).toHaveLength(35);
    expect(new Set(BACKEND_API_SURFACE.map(x=>x.method+" "+x.endpoint)).size).toBe(35);
    expect(BACKEND_API_SURFACE.some(x=>x.endpoint==="/api/v1/security-metadata")).toBe(true);
    expect(BACKEND_API_SURFACE.some(x=>x.endpoint==="/api/v1/stocks/{ticker}/research-analysis")).toBe(true);
    expect(BACKEND_API_SURFACE.some(x=>x.method==="POST"&&x.endpoint.endsWith("/compare"))).toBe(true);
    expect(apiSurfaceTotals().total).toBe(BACKEND_API_SURFACE.length);
  });
  it("maps to internal web UI without claiming that backend private sources were verified",()=>{
    for(const route of BACKEND_API_SURFACE){
      expect(route.href===null||route.href.startsWith("/")).toBe(true);
      expect(route.note.length).toBeGreaterThan(0);
      expect(["ui_mapped","partial","pending"]).toContain(route.status);
    }
  });
});
