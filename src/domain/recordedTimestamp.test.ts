import {describe,it,expect} from "vitest";
import {recordedStartDay,formatRecordedTime} from "./recordedTimestamp";
describe("recorded execution timestamp safety",()=>{
 it("derives UTC days only from valid recorded instants",()=>{
  expect(recordedStartDay("2026-11-03T00:30:00+09:00")).toBe("2026-11-02");
  expect(recordedStartDay(null)).toBeNull();
  expect(recordedStartDay("not-an-instant")).toBeNull();
 });
 it("renders invalid timestamps as unavailable without throwing",()=>{
  expect(formatRecordedTime("not-an-instant","en")).toBe("Unavailable");
  expect(formatRecordedTime(null,"ko")).toBe("—");
  expect(formatRecordedTime("2026-11-03T00:00:00Z","en")).not.toBe("Unavailable");
 });
});
