import {describe,expect,it} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {OhlcvChart} from "./OhlcvChart";

const bars=[
 {date:"2026-11-02",open:100,high:110,low:90,close:105,volume:100},
 {date:"2026-11-03",open:105,high:115,low:99,close:110,volume:200}
];
describe("accessible market chart",()=>{
 it("exposes a native keyboard date selector and data summary independent of the hidden SVG",()=>{
  const html=renderToStaticMarkup(createElement(OhlcvChart,{ticker:"005930",bars,locale:"en"}));
  expect(html).toContain('aria-label="Detailed OHLCV trading date"');
  expect(html).toContain('<select');
  expect(html).toContain('value="2026-11-03"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('2026-11-02');
  expect(html).toContain('2026-11-03');
  expect(html).not.toContain('role="button"');
  expect(html).toContain("Select trading date");
 });
 it("labels the same date selection workflow in Korean",()=>{
  const html=renderToStaticMarkup(createElement(OhlcvChart,{ticker:"005930",bars,locale:"ko"}));
  expect(html).toContain("거래일 선택");
  expect(html).toContain('aria-label="상세 OHLCV 거래일"');
 });
});
