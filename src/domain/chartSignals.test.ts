import { describe, expect, it } from "vitest";
import { groupChartAnalyses } from "./chartSignals";
import type { StockAnalysisRecord } from "./stockAnalysis";
const bars = ["2026-10-01","2026-10-02"].map(date => ({ date, open:10, high:12, low:9, close:11, volume:100 }));
const record = (id:string, dataThrough:string, direction:StockAnalysisRecord["direction"] = "up"):StockAnalysisRecord => ({
  id, ticker:"005930", dataThrough, analyzedAt:"2026-10-03T18:00:00+09:00", modelId:"demo", modelVersion:"v1", direction, score:0.6, validation:"pending", explanation:null,
});
describe("chart analysis markers", () => {
  it("groups multiple runs on the same observed candle without discarding records", () => {
    const markers = groupChartAnalyses(bars,[record("b","2026-10-01"),record("a","2026-10-01","down")]);
    expect(markers).toHaveLength(1);
    expect(markers[0].records.map(r=>r.id)).toEqual(["a","b"]);
  });
  it("does not move analyses to other trading days or invent missing candles", () => {
    expect(groupChartAnalyses(bars,[record("missing","2026-10-05")])).toEqual([]);
  });
  it("preserves pending/blocked validation and model identity", () => {
    const r=record("x","2026-10-02");r.validation="blocked";
    expect(groupChartAnalyses(bars,[r])[0].records[0]).toEqual(r);
  });
});
