import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
export default defineConfig({
 testDir:"./e2e",
 testMatch:"**/*.spec.mjs",
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?1:0,
 workers:process.env.CI?2:undefined,
 reporter:process.env.CI?[["list"],["html",{open:"never",outputFolder:"playwright-report"}]]:[["list"]],
 timeout:30000,
 expect:{timeout:10000},
 use:{
  baseURL,
  trace:"retain-on-failure",
  screenshot:"only-on-failure",
  video:"off",
  actionTimeout:10000
 },
 projects:[
  {name:"chromium-desktop",use:{...devices["Desktop Chrome"],locale:"en-US"}},
  {name:"chromium-mobile",use:{...devices["Desktop Chrome"],viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:"en-US"}}
 ],
 webServer:{
  command:"npm run start",
  url:baseURL+"/api/health",
  reuseExistingServer:!process.env.CI,
  timeout:60000,
  env:{
   MARKET_LENS_DATA_SOURCE:"mock",
   MARKET_LENS_SCREENER_SOURCE:"mock",
   MARKET_LENS_OPERATIONS_SOURCE:"mock",
   // Stock OHLCV/analysis stay disconnected; never imply live source validity.
   MARKET_LENS_OHLCV_SOURCE:"disconnected",
   MARKET_LENS_STOCK_ANALYSIS_SOURCE:"disconnected",
   MARKET_LENS_PREDICTION_EVALUATION_SOURCE:"disconnected",
   DONGHAK_API_BASE_URL:""
  }
 }
});
