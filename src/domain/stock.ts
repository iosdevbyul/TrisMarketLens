export type StockDataStatus = "mock" | "api";

export interface StockSummary {
  ticker: string;
  name: string | null;
  market: "KOSPI";
  sector: string | null;
}

export interface StockDetail extends StockSummary {
  dataStatus: StockDataStatus;
  latestDataDate: string;
  availableFrom: string;
  evidenceNote: string;
  chartNote: string;
}

export function stockDisplayName(stock: Pick<StockSummary, "ticker" | "name">): string {
  return stock.name?.trim() || stock.ticker;
}

export function stockSectorLabel(stock: Pick<StockSummary, "sector">): string {
  return stock.sector?.trim() || "Sector unavailable";
}

export function filterStocks(stocks: StockSummary[], query: string): StockSummary[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return stocks;
  }

  return stocks.filter((stock) =>
    [stock.ticker, stock.name, stock.sector]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(normalized)),
  );
}
