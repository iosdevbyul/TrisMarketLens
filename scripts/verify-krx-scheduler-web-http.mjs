// Verify operator-local KRX scheduler diagnostics without changing scheduler or collection state.
const backend=(process.env.DONGHAK_API_BASE_URL??"").trim().replace(/\/+$/,"");
const web=(process.env.MARKET_LENS_URL??"http://127.0.0.1:3000").trim().replace(/\/+$/,"");
const loopback=/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;
if(process.env.MARKET_LENS_DATA_SOURCE!=="http")throw Error("MARKET_LENS_DATA_SOURCE must be http");
if(!loopback.test(backend)||!loopback.test(web))throw Error("Only local HTTP services are allowed");
function assert(condition,message){if(!condition)throw Error(message);}
const endpoint=backend+"/api/v1/operations/krx-scheduler/diagnostics";
const result=await fetch(endpoint,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)});
assert([200,503].includes(result.status),"Unexpected KRX scheduler diagnostics HTTP "+result.status);
const page=await fetch(web+"/operations",{headers:{Accept:"text/html"},cache:"no-store",signal:AbortSignal.timeout(8000)});
assert(page.ok,"Operations web page returned HTTP "+page.status);
const html=await page.text();
assert(html.includes("Scheduler diagnostics"),"Operations page is missing KRX scheduler diagnostics");
if(result.status===503){
 assert(html.includes("Diagnostics unavailable")&&html.includes("provider is not configured"),
  "Missing diagnostics provider is not clearly displayed in web");
 console.log("PASS: unavailable provider (HTTP 503) is shown without fake KRX status");
}else{
 const payload=await result.json();
 assert(payload.version==="krx_operations_diagnostics_v1"&&
  Number.isSafeInteger(payload.storedObservations)&&payload.storedObservations>=0&&
  Number.isSafeInteger(payload.dueSessions)&&payload.dueSessions>=0&&
  payload.operatorConfirmationStillRequired===true&&payload.networkRequests===0&&
  payload.schedulerChanged===false&&payload.paperExecutionEligible===false,
  "Backend returned an unexpected or unsafe KRX scheduler diagnostic");
 assert(html.includes(String(payload.storedObservations)) &&
  html.includes(String(payload.dueSessions)),"Web dashboard does not display backend diagnostics");
 console.log("PASS: backend KRX diagnostics and web dashboard agree");
 console.log("Stored observations:",payload.storedObservations,"Due sessions:",payload.dueSessions);
}
console.log("Read-only diagnostics: no KRX requests, scheduler changes, or order authorization performed.");
