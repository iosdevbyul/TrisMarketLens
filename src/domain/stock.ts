export type StockDataStatus = "mock" | "api";

export interface StockSummary {
  ticker: string;
  name: string;
  market: "KOSPI";
  sector: string;
}

export interface StockDetail extends StockSummary {
  dataStatus: StockDataStatus;
  latestDataDate: string;
  availableFrom: string;
  evidenceNote: string;
  chartNote: string;
}

export function filterStocks(stocks: StockSummary[], query: string): StockSummary[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return stocks;
  }

  return stocks.filter((stock) =>
    [stock.ticker, stock.name, stock.sector].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  );
}
