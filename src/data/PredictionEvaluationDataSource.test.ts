import { describe, expect, it, vi } from "vitest";
import { demoPredictionEvaluations, loadPredictionEvaluations } from "./PredictionEvaluationDataSource";
import { isPredictionEvaluationSnapshot } from "../domain/predictionEvaluation";
describe("prediction evaluations",()=>{
  it("defaults to an empty, unscored state",async()=>{const v=await loadPredictionEvaluations("005930");expect(v.data.evaluations).toEqual([]);});
  it("labels demo data and validates its structure",async()=>{const v=await loadPredictionEvaluations("005930",{mode:"mock"});expect(v.source).toBe("mock");expect(isPredictionEvaluationSnapshot(v.data,"005930")).toBe(true);});
  it("rejects different tickers and fabricated pending outcomes",()=>{
    const v=demoPredictionEvaluations("005930");
    expect(isPredictionEvaluationSnapshot(v,"000660")).toBe(false);
    expect(isPredictionEvaluationSnapshot({...v,evaluations:[{...v.evaluations[0],realizedReturn:0.3}]},"005930")).toBe(false);
  });
  it("reads a dedicated endpoint without caching",async()=>{
    const fetcher=vi.fn(async()=>Response.json(demoPredictionEvaluations("005930")));
    const v=await loadPredictionEvaluations("005930",{mode:"http",apiBaseUrl:"http://localhost:8000/",fetcher:fetcher as typeof fetch});
    expect(v.error).toBeNull();
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/stocks/005930/evaluations",expect.objectContaining({cache:"no-store"}));
  });
  it("never substitutes demo results after HTTP failure",async()=>{
    const v=await loadPredictionEvaluations("005930",{mode:"http",apiBaseUrl:"http://localhost:8000",fetcher:(async()=>new Response(null,{status:404})) as typeof fetch});
    expect(v.error).toContain("404");expect(v.data.evaluations).toEqual([]);
  });
});
