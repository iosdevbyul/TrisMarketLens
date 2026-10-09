import { describe, expect, it } from "vitest";

import { filterStocks, type StockSummary } from "./stock";

const stocks: StockSummary[] = [
  { ticker: "005930", name: "Samsung Electronics", market: "KOSPI", sector: "Semiconductors" },
  { ticker: "005380", name: "Hyundai Motor", market: "KOSPI", sector: "Automobiles" },
];

describe("filterStocks", () => {
  it("matches ticker, company name, and sector case-insensitively", () => {
    expect(filterStocks(stocks, "005930")).toHaveLength(1);
    expect(filterStocks(stocks, "hyundai")[0]?.ticker).toBe("005380");
    expect(filterStocks(stocks, "SEMICONDUCTORS")[0]?.ticker).toBe("005930");
  });

  it("returns all stocks for an empty query", () => {
    expect(filterStocks(stocks, "   ")).toEqual(stocks);
  });
});
