import {describe,it,expect} from "vitest";
import {recordedRunBadgeTone} from "./recordedRunBadge";
describe("recorded execution badge semantics",()=>{
 it("does not mark unknown recorded outcomes as blocked",()=>{
  expect(recordedRunBadgeTone("unknown")).toBe("recorded");
 });
 it("does not equate a succeeded run with verified acquisition",()=>{
  expect(recordedRunBadgeTone("succeeded")).toBe("recorded");
 });
 it("preserves explicit failure, blocking and in-progress states",()=>{
  expect(recordedRunBadgeTone("failed")).toBe("blocked");
  expect(recordedRunBadgeTone("blocked")).toBe("blocked");
  expect(recordedRunBadgeTone("queued")).toBe("in_progress");
  expect(recordedRunBadgeTone("running")).toBe("in_progress");
 });
});
