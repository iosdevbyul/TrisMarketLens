"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { WakButton } from "@/components/design-system/WakButton";
import { WakTextInput } from "@/components/design-system/WakTextInput";

import {
  filterStocks,
  stockDisplayName,
  stockSectorLabel,
  type StockSummary,
} from "@/domain/stock";

interface StockExplorerProps {
  stocks: StockSummary[];
}

export function StockExplorer({ stocks }: StockExplorerProps) {
  const [query, setQuery] = useState("");
  const filteredStocks = useMemo(() => filterStocks(stocks, query), [stocks, query]);

  return (
    <section className="stock-explorer">
      <div className="stock-search-row">
        <WakTextInput
          aria-label="Search stocks"
          className="stock-search"
          label="Search stocks"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ticker, company, or sector"
          type="search"
          value={query}
        />
        <div className="stock-search-actions">
          {query ? (
            <WakButton aria-label="Clear stock search" onClick={() => setQuery("")} variant="secondary">
              Clear search
            </WakButton>
          ) : null}
          <span className="panel-count">{filteredStocks.length} records</span>
        </div>
      </div>

      <div className="stock-table" role="list">
        {filteredStocks.map((stock) => (
          <Link className="stock-row" href={`/stocks/${stock.ticker}`} key={stock.ticker}>
            <div>
              <p className="stock-name">{stockDisplayName(stock)}</p>
              <p className="stock-meta">
                {stock.ticker} · {stock.market}
              </p>
            </div>
            <div className="stock-row-right">
              <span>{stockSectorLabel(stock)}</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredStocks.length === 0 ? (
        <div className="empty-state">
          <p>No matching stock.</p>
          <span>Try a ticker, company name, or available sector label.</span>
        </div>
      ) : null}
    </section>
  );
}
