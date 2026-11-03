import {describe,it,expect} from "vitest";
import {selectMatrixRow,selectMatrixColumn} from "./matrixMarginSelection";
describe("Operations matrix margin selection",()=>{
 it("selects a row across all evidence and toggles an active row off",()=>{
  expect(selectMatrixRow({state:"failed",evidence:"invalid"},"failed")).toEqual({state:"failed",evidence:"all"});
  expect(selectMatrixRow({state:"failed",evidence:"all"},"failed")).toEqual({state:"all",evidence:"all"});
  expect(selectMatrixRow({state:"blocked",evidence:"partial"},"failed")).toEqual({state:"failed",evidence:"all"});
 });
 it("selects a column across all execution states and toggles an active column off",()=>{
  expect(selectMatrixColumn({state:"failed",evidence:"invalid"},"invalid")).toEqual({state:"all",evidence:"invalid"});
  expect(selectMatrixColumn({state:"all",evidence:"invalid"},"invalid")).toEqual({state:"all",evidence:"all"});
  expect(selectMatrixColumn({state:"blocked",evidence:"partial"},"not-recorded")).toEqual({state:"all",evidence:"not-recorded"});
 });
});
