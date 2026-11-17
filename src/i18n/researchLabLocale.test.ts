import { describe, expect, it } from "vitest";
import { translate } from "./translations";

describe("Research Lab Korean evidence presentation", () => {
  it("distinguishes historical completion from investment approval", () => {
    expect(translate("ko", "Completed historical study")).toBe("과거 연구 완료");
    expect(translate("ko", "Research results are descriptive, not approved for live trading."))
      .toContain("실제 거래가 승인된 상태가 아닙니다");
    expect(translate("ko", "Research only")).toBe("연구 전용");
  });

  it("translates actual study cohorts, selection policies and diagnostic statuses", () => {
    expect(translate("ko", "historical-cohort1")).toBe("과거 연구 그룹 1");
    expect(translate("ko", "historical-cohort2")).toBe("과거 연구 그룹 2");
    expect(translate("ko", "adaptive")).toBe("적응형 탐색");
    expect(translate("ko", "predeclared")).toBe("사전 선언형 탐색");
    expect(translate("ko", "robust")).toBe("강건성 중심 탐색");
    expect(translate("ko", "internal_descriptive_sufficient")).toBe("내부 설명용 표본 충분");
    expect(translate("ko", "insufficient")).toBe("표본 부족");
  });

  it("keeps exact backend identifiers and English labels unchanged", () => {
    const id = "7fd24c9530af25df15f822c81d4ee9683332adee7c8a1d65533dd6d4c6374cfb";
    expect(translate("ko", id)).toBe(id);
    expect(translate("en", "Completed historical study")).toBe("Completed historical study");
  });
});
