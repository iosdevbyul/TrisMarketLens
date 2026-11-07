import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

vi.mock("next/navigation",()=>({
 usePathname:()=>"/research-path",
 useRouter:()=>({refresh:()=>{}})
}));
import {Sidebar} from "./Sidebar";
describe("responsive primary navigation and status",()=>{
 it("offers a keyboard skip link and correctly scoped current route",()=>{
  const html=renderToStaticMarkup(createElement(Sidebar,{locale:"en",sourceMode:"http"}));
  expect(html).toContain('href="#main-content"');
  expect(html).toContain("Skip to main content");
  expect(html).toMatch(/aria-current="page"[^>]*href="\/research-path"|href="\/research-path"[^>]*aria-current="page"/);
  expect(html).not.toContain("Mock research data");
  expect(html).toContain("verify connection in Diagnostics");
 });
 it("labels mock/disconnected modes without claiming live HTTP data is connected",()=>{
  const demo=renderToStaticMarkup(createElement(Sidebar,{locale:"ko",sourceMode:"mock"}));
  expect(demo).toContain("모의 연구 데이터");
  const missing=renderToStaticMarkup(createElement(Sidebar,{locale:"en",sourceMode:"disconnected"}));
  expect(missing).toContain("Research source disconnected");
 });
});
