import { test, expect } from "@playwright/test";

const localOrigin="http://127.0.0.1:3000";

test("Korean research lab renders translated headings, safety copy and existing status correctly", async ({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/ai-research-lab");
  await expect(page.getByRole("heading",{name:"동학 자율 연구"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"연구 근거 출처"})).toBeVisible();
  await expect(page.getByRole("link",{name:"AI 연구소"})).toBeVisible();
  await expect(page.getByText("기존 읽기 전용 로컬 연구 게시 데이터가 필요합니다.",{exact:false})).toBeVisible();
  await expect(page.getByText("Research evidence source",{exact:true})).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang","ko");
});

test("Korean metadata screen never masks optional backend unavailability with synthetic data",async({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/security-metadata?q=005930");
  await expect(page.getByRole("heading",{name:"종목 메타데이터 목록"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"게시 상태"})).toBeVisible();
  await expect(page.getByText("이 API는 동학비전에서 선택적으로 활성화됩니다.",{exact:false})).toBeVisible();
  await expect(page.getByRole("region",{name:"Security metadata search"})).toHaveCount(0);
});

test("English/Korean switch refreshes server-rendered page and client navigation without losing current route",async({page})=>{
  await page.goto("/backend-api-coverage");
  await expect(page.getByRole("heading",{name:"DonghakStockVision API coverage"})).toBeVisible();
  await page.getByRole("button",{name:"한국어"}).click();
  await expect(page).toHaveURL(/\/backend-api-coverage$/);
  await expect(page.getByRole("heading",{name:"동학비전 API 연동 현황"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"연동 목록"})).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang","ko");
  await page.getByRole("button",{name:"English"}).click();
  await expect(page.getByRole("heading",{name:"DonghakStockVision API coverage"})).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
});

test("Korean operational client controls use shared locale instead of untranslated labels", async ({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/operations");
  await expect(page.getByRole("heading",{name:"기록된 운영 실행",exact:true}).first()).toBeVisible();
  await expect(page.getByText("실행별 근거 상태",{exact:true}).first()).toBeVisible();
  await expect(page.getByText("Execution × evidence breakdown",{exact:true})).toHaveCount(0);
});

test("Korean model management notices and research source descriptions are translated", async ({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/ai-research-models?notice=backend-403");
  await expect(page.getByRole("heading",{name:"AI 연구용 언어 모델"})).toBeVisible();
  await expect(page.getByText("설정된 토큰에 모델 관리 권한이 없습니다.")).toBeVisible();
  await expect(page.getByText("The configured token lacks management permission.")).toHaveCount(0);
  await page.goto("/research-status");
  await expect(page.getByText("시장 데이터 모드:",{exact:false}).first()).toBeVisible();
  await expect(page.getByText("Market source mode:",{exact:false})).toHaveCount(0);
});

test("Korean portfolio and ticker navigation translates previously unwrapped links",async({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/backtesting/portfolios");
  await expect(page.getByRole("link",{name:"← 백테스트로 돌아가기"})).toBeVisible();
  await page.goto("/security-metadata");
  await expect(page.getByRole("link",{name:"← 종목 목록으로 돌아가기"})).toBeVisible();
});

test("Korean research lab publication and prior empty evidence preserve correct claims",async({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/ai-research-lab");
  await expect(page.getByRole("heading",{name:"동학 자율 연구"})).toBeVisible();
  await expect(page.getByText("동학비전에 보존된 실제 실험 기록을 바탕으로 한 읽기 전용 연구 관제실입니다.",{exact:false})).toBeVisible();
  await expect(page.getByText("The existing read-only local research publication is required.",{exact:false})).toHaveCount(0);
});

test("Korean Research Lab distinguishes unavailable approved API from legacy snapshot",async({page,context})=>{
  await context.addCookies([{name:"tris-locale",value:"ko",url:localOrigin}]);
  await page.goto("/ai-research-lab");
  await expect(page.getByRole("heading",{name:"승인된 연구소 API를 사용할 수 없음"})).toBeVisible();
  await expect(page.getByText("아래 기존 로컬 스냅샷은 승인된 신규 6개 연구 API와 별개이며",{exact:false})).toBeVisible();
  await expect(page.getByText("72 completed experiments")).toHaveCount(0);
  await page.goto("/ai-research-lab/reports");
  await expect(page.getByText("가상의 연구·보고서·실험 ID·모델 성능으로 대체하지 않습니다.",{exact:false})).toBeVisible();
});
