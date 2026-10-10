import {describe,expect,it} from "vitest";
import {filterOperationalAlerts,isOperationalAlertSnapshot} from "./operationalAlerts";
import {demoAlerts} from "../data/OperationalAlertsDataSource";
describe("operational alerts",()=>{
 it("validates explicit demonstration records",()=>expect(isOperationalAlertSnapshot(demoAlerts)).toBe(true));
 it("rejects resolved status without resolution timestamp",()=>expect(isOperationalAlertSnapshot({alerts:[{...demoAlerts.alerts[1],resolvedAt:null}]})).toBe(false));
 it("filters status and severity without altering inputs",()=>{
  const original=[...demoAlerts.alerts];
  expect(filterOperationalAlerts(original,"open","warning").map(a=>a.id)).toEqual(["demo-alert-001"]);
  expect(original).toEqual(demoAlerts.alerts);
 });
});
