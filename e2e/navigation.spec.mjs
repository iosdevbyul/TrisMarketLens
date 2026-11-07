import {test,expect} from "@playwright/test";

test.beforeEach(async ({context})=>{
 await context.addCookies([{name:"tris-locale",value:"en",url:"http://127.0.0.1:3000"}]);
});

test("navigate across the research dashboard, stocks, models and evidence",async ({page})=>{
 await page.goto("/");
 await expect(page.locator("#main-content")).toBeVisible();
 await expect(page.getByRole("link",{name:"Open integrated research path"})).toBeVisible();
 const nav=page.getByRole("navigation",{name:"Primary navigation"});
 await nav.getByRole("link",{name:"Stocks",exact:true}).click();
 await expect(page).toHaveURL(/\/stocks$/);
 await expect(page.getByRole("heading",{level:1})).toContainText("Stocks");
 await nav.getByRole("link",{name:"Models",exact:true}).click();
 await expect(page).toHaveURL(/\/models$/);
 await expect(page.getByRole("heading",{level:1})).toContainText("Models");
 await nav.getByRole("link",{name:"Evidence",exact:true}).click();
 await expect(page).toHaveURL(/\/evidence$/);
 await expect(page.getByRole("heading",{level:1})).toContainText("Evidence");
});

test("skip navigation reaches main landmark without a mouse",async ({page})=>{
 await page.goto("/");
 const skip=page.getByRole("link",{name:"Skip to main content"});
 await page.keyboard.press("Tab");
 await expect(skip).toBeFocused();
 await page.keyboard.press("Enter");
 await expect(page.locator("#main-content")).toBeFocused();
});

test("stock search and clearing act on locally displayed demo universe",async ({page})=>{
 await page.goto("/stocks");
 const field=page.getByRole("searchbox",{name:"Search stocks"});
 await expect(field).toBeVisible();
 await field.fill("NOT-A-REAL-TICKER-XYZ");
 await expect(page.getByText("No matching stock.")).toBeVisible();
 await page.getByRole("button",{name:"Clear stock search"}).click();
 await expect(field).toHaveValue("");
 const stocks=page.locator(".stock-row");
 await expect(stocks.first()).toBeVisible();
 await stocks.first().click();
 await expect(page).toHaveURL(/\/stocks\/[A-Z0-9]{6}$/);
 await expect(page.getByText("Mock stock detail")).toBeVisible();
 await expect(page.getByRole("link",{name:/Trace this ticker through collection/})).toBeVisible();
});

test("responsive navigation works in a narrow mobile browser",async ({page},testInfo)=>{
 test.skip(!testInfo.project.name.includes("mobile"),"Mobile viewport only");
 await page.goto("/");
 const nav=page.getByRole("navigation",{name:"Primary navigation"});
 await expect(nav).toBeVisible();
 await nav.getByRole("link",{name:"Research Path"}).click();
 await expect(page).toHaveURL(/\/research-path$/);
 await expect(page.getByRole("heading",{name:"Follow the evidence"})).toBeVisible();
 await expect(page.locator("main")).toBeVisible();
});
