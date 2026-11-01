import { describe, expect, it, vi } from "vitest";
import { isSchedulerDiagnostics, loadSchedulerDiagnostics } from "./KrxSchedulerDiagnosticsDataSource";
const fixture = {
 version:"krx_operations_diagnostics_v1",status:"collection_due",schedulerEnabled:false,
 lastPersistedTradingDate:"2026-10-28",storedObservations:940,completedSessions:0,
 dueSessions:1,expiredSessions:0,reservedWithoutVerifiedCompletion:0,
 storedWithoutVerifiedHistory:0,oldestDueDate:"2026-10-29",pendingPhase:null,
 storageCapacityReady:true,preflightBlockers:[],readyForManualCapture:false,
 readyForScheduledCollection:false,operatorConfirmationStillRequired:true,
 networkRequests:0,schedulerChanged:false,paperExecutionEligible:false,
};
describe("KRX scheduler diagnostics",()=>{
 it("accepts the published read-only contract",()=>{
  expect(isSchedulerDiagnostics(fixture)).toBe(true);
 });
 it("uses the actual published endpoint",async()=>{
  const fetcher=vi.fn(async()=>Response.json(fixture));
  const r=await loadSchedulerDiagnostics("http://localhost:8000/",fetcher as typeof fetch);
  expect(r.error).toBeNull();
  expect(r.data?.dueSessions).toBe(1);
  expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/operations/krx-scheduler/diagnostics",expect.objectContaining({cache:"no-store"}));
 });
 it("does not manufacture data when provider is absent",async()=>{
  const r=await loadSchedulerDiagnostics("http://localhost:8000", (async()=>new Response(null,{status:503})) as typeof fetch);
  expect(r.data).toBeNull();expect(r.error).toContain("not configured");
 });
 it("rejects malformed or unsafe reports",async()=>{
  for(const payload of [{...fixture,networkRequests:1},{...fixture,paperExecutionEligible:true},{...fixture,storedObservations:-1},{...fixture,version:"other"}]){
   const r=await loadSchedulerDiagnostics("http://localhost:8000", (async()=>Response.json(payload)) as typeof fetch);
   expect(r.data).toBeNull();expect(r.error).toContain("invalid");
  }
 });
});
