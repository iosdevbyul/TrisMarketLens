// Generate an evidence-neutral verification report. Never execute API calls here.
import { writeFileSync } from "node:fs";
const choices=new Set(["passed","failed","not_run"]);
const statuses={
  ci:process.env.VERIFY_CI_STATUS??"not_run",
  http:process.env.VERIFY_HTTP_STATUS??"not_run",
  extensions:process.env.VERIFY_EXTENSIONS_STATUS??"not_run",
  evidence:process.env.VERIFY_EVIDENCE_STATUS??"not_run",
};
for(const [key,value] of Object.entries(statuses))if(!choices.has(value))throw Error("Invalid "+key+" status; expected passed, failed or not_run");
const clean=(v)=>(v??"").replace(/[\r\n\t]/g," ").slice(0,500);
const source={repository:"iosdevbyul/TrisMarketLens",commit:clean(process.env.VERIFY_COMMIT),pr:clean(process.env.VERIFY_PR),ciRunUrl:clean(process.env.VERIFY_CI_URL),ticker:clean(process.env.MARKET_LENS_VERIFY_TICKER),snapshotId:clean(process.env.VERIFY_SNAPSHOT_ID),notes:clean(process.env.VERIFY_NOTES)};
const report={schemaVersion:"web_verification_v1",generatedAt:new Date().toISOString(),...source,statuses,unverified:Object.entries(statuses).filter(([,value])=>value!=="passed").map(([key])=>key),claim:"This report records operator-provided statuses; it does not perform independent checks or certify market data."};
const file=process.argv[2];
if(file && !/^[a-zA-Z0-9_.-]+\.json$/.test(file))throw Error("Output must be a simple .json filename in the current directory");
const result=JSON.stringify(report,null,2)+"\n";
if(file){writeFileSync(file,result,{flag:"wx"});console.log("Created report "+file);}else process.stdout.write(result);
