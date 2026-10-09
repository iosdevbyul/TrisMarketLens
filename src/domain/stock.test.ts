import { describe, expect, it } from "vitest";

import {
  filterStocks,
  stockDisplayName,
  stockSectorLabel,
  type StockSummary,
} from "./stock";

const stocks: StockSummary[] = [
  {
    ticker: "005930",
    name: "Samsung Electronics",
    market: "KOSPI",
    sector: "Semiconductors",
  },
  {
    ticker: "005380",
    name: "Hyundai Motor",
    market: "KOSPI",
    sector: "Automobiles",
  },
  {
    ticker: "000060",
    name: null,
    market: "KOSPI",
    sector: null,
  },
];

describe("filterStocks", () => {
  it("matches ticker, company name, and sector case-insensitively", () => {
    expect(filterStocks(stocks, "005930")).toHaveLength(1);
    expect(filterStocks(stocks, "hyundai")[0]?.ticker).toBe("005380");
    expect(filterStocks(stocks, "SEMICONDUCTORS")[0]?.ticker).toBe("005930");
  });

  it("handles nullable API metadata without crashing search", () => {
    expect(filterStocks(stocks, "000060")[0]?.ticker).toBe("000060");
    expect(filterStocks(stocks, "insurance")).toHaveLength(0);
  });

  it("returns all stocks for an empty query", () => {
    expect(filterStocks(stocks, "   ")).toEqual(stocks);
  });
});

describe("stock display helpers", () => {
  it("falls back to the ticker when an official company name is unavailable", () => {
    expect(stockDisplayName(stocks[2])).toBe("000060");
  });

  it("uses a neutral sector label when sector metadata is unavailable", () => {
    expect(stockSectorLabel(stocks[2])).toBe("Sector unavailable");
  });
});
