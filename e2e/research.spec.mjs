import {test,expect} from "@playwright/test";

test.beforeEach(async ({context})=>{
 await context.addCookies([{name:"tris-locale",value:"en",url:"http://127.0.0.1:3000"}]);
});

test("research path preserves ticker selection and labels demonstration evidence",async ({page})=>{
 await page.goto("/research-path");
 await expect(page.getByRole("heading",{name:"Follow the evidence"})).toBeVisible();
 await page.getByRole("textbox",{name:"Ticker"}).fill("005930");
 await page.getByRole("button",{name:"Trace research"}).click();
 await expect(page).toHaveURL(/\/research-path\?ticker=005930$/);
 await expect(page.getByText("Backend data mode: mock.",{exact:false})).toBeVisible();
 await expect(page.getByRole("region",{name:"Integrated research steps"})).toBeVisible();
 await expect(page.getByRole("link",{name:"Inspect recorded source"})).toHaveCount(7);
 await expect(page.getByText("HTTP research configured",{exact:false})).toHaveCount(0);
});

test("screener filters demonstrate empty and restored results without live-API claims",async ({page})=>{
 await page.goto("/screener");
 await expect(page.getByRole("heading",{name:"AI Screener"})).toBeVisible();
 await expect(page.getByText("All screener records are fictional examples",{exact:false})).toBeVisible();
 const search=page.getByRole("textbox",{name:"Search ticker, name or model"});
 await search.fill("UNMATCHED-E2E-QUERY-XYZ");
 await expect(page.getByText("No analyses match your filters.")).toBeVisible();
 await search.fill("");
 await expect(page.locator(".screener-table tbody tr").first()).toBeVisible();
 await page.getByLabel("Direction",{exact:true}).selectOption("up");
 await expect(page.getByText("matching analyses")).toBeVisible();
});

test("model research workbench does not claim cross-source corroboration in demo mode",async ({page})=>{
 await page.goto("/research-workbench?ticker=005930");
 await expect(page.getByRole("heading",{name:"Research evidence workbench"})).toBeVisible();
 await expect(page.getByText("All demonstration model and signal records are fictional",{exact:false})).toBeVisible();
 await expect(page.getByText("Verified source correspondence",{exact:false})).toHaveCount(0);
 await expect(page.getByText("Fictional demonstration analysis",{exact:false})).toBeVisible();
});

test("operations, diagnostics and portfolios report source limits instead of fabricated availability",async ({page})=>{
 await page.goto("/operations");
 await expect(page.getByRole("heading",{name:"Recorded operations"})).toBeVisible();
 await page.getByRole("link",{name:/Trace KRX collection/}).click();
 await expect(page.getByRole("heading",{name:"Collection to research evidence trace"})).toBeVisible();
 await page.goto("/diagnostics");
 await expect(page.getByRole("heading",{name:"Backend diagnostics"})).toBeVisible();
 await expect(page.getByText("Configured data mode: mock")).toBeVisible();
 await page.goto("/backtesting/portfolios");
 await expect(page.getByRole("heading",{name:"Published historical portfolios"})).toBeVisible();
 await expect(page.getByText("HTTP mode is required to read actual published portfolios.",{exact:false})).toBeVisible();
 await expect(page.getByRole("link",{name:/Compare 2 selected research reports/})).toHaveCount(0);
});

test("web health explicitly labels mock mode and does not assert backend connection",async ({request})=>{
 const response=await request.get("/api/health");
 expect(response.ok()).toBeTruthy();
 const health=await response.json();
 expect(health.app).toBe("TrisMarketLens");
 expect(health.dataSource).toBe("mock");
 expect(health.backend?.status).not.toBe("ok");
});
