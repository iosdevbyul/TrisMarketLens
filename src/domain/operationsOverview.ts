import type {OperationsResult} from "../data/OperationsDataSource";
import type {FreshnessResult} from "../data/FreshnessDataSource";
import type {AlertResult} from "../data/OperationalAlertsDataSource";
import {derivePipelineHealth} from "./pipelineHealth";
export type OverviewState="unknown"|"attention"|"active"|"reported_healthy";
export interface OperationsOverview {state:OverviewState; pipeline:"unknown"|"attention"|"active"|"reported_success"; freshness:"current"|"delayed"|"unknown"; openAlerts:number|null; criticalAlerts:number|null; sourcesComplete:boolean}
export function summarizeOperationsOverview(operations:OperationsResult,freshness:FreshnessResult,alerts:AlertResult):OperationsOverview {
 const pipeline=operations.error||operations.source==="disconnected"?"unknown":derivePipelineHealth(operations.snapshot).state;
 const currentFreshness=freshness.error||freshness.source==="disconnected"?"unknown":freshness.report?.state??"unknown";
 const alertsAvailable=!alerts.error&&alerts.source!=="disconnected";
 const openAlerts=alertsAvailable?alerts.data.alerts.filter(a=>a.status==="open").length:null;
 const criticalAlerts=alertsAvailable?alerts.data.alerts.filter(a=>a.status==="open"&&a.severity==="critical").length:null;
 const sourcesComplete=operations.source!=="disconnected"&&!operations.error&&freshness.source!=="disconnected"&&!freshness.error&&alertsAvailable;
 const attention=pipeline==="attention"||currentFreshness==="delayed"||(openAlerts!==null&&openAlerts>0);
 const state:OverviewState=attention?"attention":pipeline==="active"?"active":!sourcesComplete||pipeline!=="reported_success"||currentFreshness!=="current"?"unknown":"reported_healthy";
 return {state,pipeline,freshness:currentFreshness,openAlerts,criticalAlerts,sourcesComplete};
}
