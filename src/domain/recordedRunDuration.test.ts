import {describe,it,expect} from "vitest";
import {recordedRunDuration} from "./recordedRunDuration";
describe("recorded execution duration",()=>{
 it("uses actual start and end timestamps",()=>{
  expect(recordedRunDuration({startedAt:"2026-11-01T10:00:00Z",finishedAt:"2026-11-01T11:02:03Z"})).toBe("1h 2m 3s");
  expect(recordedRunDuration({startedAt:"2026-11-01T10:00:00Z",finishedAt:"2026-11-01T10:00:59Z"})).toBe("59s");
 });
 it("does not infer duration from missing or reversed timestamps",()=>{
  expect(recordedRunDuration({startedAt:null,finishedAt:"2026-11-01T10:00:00Z"})).toBeNull();
  expect(recordedRunDuration({startedAt:"2026-11-01T11:00:00Z",finishedAt:"2026-11-01T10:00:00Z"})).toBeNull();
 });
});
